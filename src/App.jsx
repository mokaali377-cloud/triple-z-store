
import React, { useEffect, useMemo, useState } from 'react';
import emailjs from '@emailjs/browser';
import { ShoppingBag, X, Plus, Minus, ArrowUpRight, ShieldCheck, Package, LogIn, LogOut, RefreshCw } from 'lucide-react';
import { isSupabaseConfigured, supabase } from './supabase';

const demoProducts = [
  { id: 'demo-1', name: 'Z Shadow Hoodie', description: 'Oversized streetwear fit', price: 799, image_url: '', sizes: ['S','M','L','XL'], colors: ['أسود','أبيض'], stock: 10, is_active: true },
  { id: 'demo-2', name: 'Triple Line Sweatshirt', description: 'Everyday heavyweight style', price: 599, image_url: '', sizes: ['M','L','XL'], colors: ['أسود','رمادي'], stock: 8, is_active: true },
  { id: 'demo-3', name: 'Z Essential Tee', description: 'Clean graphic tee', price: 299, image_url: '', sizes: ['S','M','L','XL'], colors: ['أبيض','أسود'], stock: 15, is_active: true }
];

const money = n => `${Number(n || 0).toLocaleString('en-US')} ج.م`;

function Placeholder({ name }) {
  return <div className="product-placeholder"><span>TRIPLE</span><strong>Z</strong><small>{name}</small></div>;
}

export default function App() {
  const [products, setProducts] = useState(demoProducts);
  const [cart, setCart] = useState([]);
  const [drawer, setDrawer] = useState(false);
  const [selected, setSelected] = useState({});
  const [checkout, setCheckout] = useState(false);
  const [form, setForm] = useState({ customer_name: '', phone: '', address: '' });
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [newProduct, setNewProduct] = useState({ name: '', price: '', image_url: '', description: '', stock: '1', sizes: 'S,M,L,XL', colors: 'أسود,أبيض' });
  const [adminOrders, setAdminOrders] = useState([]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    loadProducts();
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadProducts() {
    if (!supabase) return;
    const { data, error } = await supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false });
    if (!error && data) setProducts(data);
  }

  const total = useMemo(() => cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0), [cart]);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  function addToCart(product) {
    const options = selected[product.id] || { size: product.sizes?.[0] || 'M', color: product.colors?.[0] || 'أسود' };
    const key = `${product.id}-${options.size}-${options.color}`;
    setCart(old => {
      const found = old.find(i => i.key === key);
      if (found) return old.map(i => i.key === key ? { ...i, quantity: i.quantity + 1 } : i);
      return [...old, { key, product_id: product.id, name: product.name, price: Number(product.price), image_url: product.image_url, size: options.size, color: options.color, quantity: 1 }];
    });
    setNotice('اتضاف للسلة بنجاح');
    setDrawer(true);
  }

  function changeQty(key, delta) {
    setCart(old => old.map(i => i.key === key ? { ...i, quantity: i.quantity + delta } : i).filter(i => i.quantity > 0));
  }

  async function submitOrder(e) {
    e.preventDefault();

    if (!cart.length) return;

    if (!isSupabaseConfigured) {
      setNotice('المتجر لسه محتاج ربط Supabase عشان نحفظ الطلبات.');
      return;
    }

    setLoading(true);
    setNotice('');

    const payload = {
      customer_name: form.customer_name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      items: cart.map(({ product_id, name, price, size, color, quantity }) => ({
        product_id,
        name,
        price,
        size,
        color,
        quantity
      })),
      total,
      status: 'new'
    };

    try {
      // أولاً: تسجيل الطلب في قاعدة البيانات
      const { error } = await supabase.from('orders').insert(payload);

      if (error) {
        console.error('Supabase order error:', error);
        setNotice('ماقدرناش نسجل الطلب. تأكد إن إعدادات قاعدة البيانات مكتملة.');
        return;
      }

      // تجهيز تفاصيل المنتجات للإيميل
      const orderItems = payload.items.map(item =>
        `${item.name} | المقاس: ${item.size} | اللون: ${item.color} | الكمية: ${item.quantity} | سعر القطعة: ${item.price} جنيه`
      ).join('\n');

      let emailSent = false;

      // ثانياً: إرسال إشعار إلى بريد المتجر باستخدام EmailJS
      try {
        await emailjs.send(
          'service_sr1rp78',
          'template_j6d9i67',
          {
            customer_name: payload.customer_name,
            phone: payload.phone,
            address: payload.address,
            order_id: `طلب جديد - ${new Date().toLocaleString('ar-EG')}`,
            order_items: orderItems,
            total: payload.total
          },
          'hiGURebO6S2IhbOwv'
        );

        emailSent = true;
      } catch (emailError) {
        console.error('EmailJS notification error:', emailError);
      }

      // الطلب محفوظ بالفعل، حتى لو فشل إرسال الإيميل
      setCart([]);
      setCheckout(false);
      setDrawer(false);
      setForm({ customer_name: '', phone: '', address: '' });

      if (emailSent) {
        setNotice('تم تسجيل الطلب بنجاح! واتبعث إشعار على Gmail بتاع المتجر.');
      } else {
        setNotice('الطلب اتسجل بنجاح، لكن إشعار Gmail ماتبعتش. راجع إعدادات EmailJS.');
      }
    } catch (error) {
      console.error('Submit order error:', error);
      setNotice('حصل خطأ أثناء تسجيل الطلب. راجع الاتصال والإعدادات.');
    } finally {
      setLoading(false);
    }
  }

  async function adminLogin(e) {
    e.preventDefault();
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithPassword({ email: adminEmail, password: adminPassword });
    setNotice(error ? 'بيانات الدخول غير صحيحة أو الحساب غير مُعدّ.' : 'تم تسجيل الدخول.');
  }

  async function loadOrders() {
    if (!supabase) return;
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (!error && data) setAdminOrders(data);
    else setNotice('تعذر تحميل الطلبات. تأكد من صلاحيات حساب الإدارة.');
  }

  async function createProduct(e) {
    e.preventDefault();
    if (!supabase) return;
    const p = {
      name: newProduct.name.trim(),
      price: Number(newProduct.price),
      image_url: newProduct.image_url.trim() || null,
      description: newProduct.description.trim(),
      stock: Number(newProduct.stock || 0),
      sizes: newProduct.sizes.split(',').map(x => x.trim()).filter(Boolean),
      colors: newProduct.colors.split(',').map(x => x.trim()).filter(Boolean),
      is_active: true
    };
    const { error } = await supabase.from('products').insert(p);
    if (error) setNotice('تعذر إضافة المنتج. تأكد من صلاحيات المدير.');
    else {
      setNotice('تمت إضافة المنتج.');
      setNewProduct({ name: '', price: '', image_url: '', description: '', stock: '1', sizes: 'S,M,L,XL', colors: 'أسود,أبيض' });
      loadProducts();
    }
  }

  async function updateOrderStatus(id, status) {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) setNotice('تعذر تحديث حالة الطلب.');
    else loadOrders();
  }

  return <div className="app-shell">
    <div className="topline">DROP 01 — STREETWEAR FOR YOUR OWN LANE</div>
    <header className="site-header">
      <a className="brand" href="#"><span>TRIPLE</span><b>Z</b></a>
      <nav><a href="#shop">المنتجات</a><a href="#about">عن TRIPLE Z</a></nav>
      <div className="header-actions">
        <button className="icon-button" aria-label="السلة" onClick={() => setDrawer(true)}><ShoppingBag size={20}/><span className="cart-count">{count}</span></button>
        <button className="admin-link" onClick={() => setAdminOpen(v => !v)}>الإدارة</button>
      </div>
    </header>

    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">NEW SEASON / 2026</p>
          <h1>OWN YOUR<br/><em>LANE.</em></h1>
          <p className="hero-text">ستايل شبابي. تفاصيل مختلفة. اختار القطعة اللي شبهك.</p>
          <a className="primary-button" href="#shop">اكتشف المجموعة <ArrowUpRight size={18}/></a>
          <div className="hero-foot"><span>01 / ORIGINAL STREETWEAR</span><span>TRIPLE Z®</span></div>
        </div>
        <div className="hero-art" aria-label="TRIPLE Z brand artwork">
          <div className="art-grid"></div><div className="art-circle"></div><div className="art-cross">✳</div>
          <div className="art-type">NO<br/>RULES<span>.</span></div>
          <div className="art-stamp">TZ / 001<br/>EST. 2026</div>
        </div>
      </section>

      {notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice('')}><X size={16}/></button></div>}

      {adminOpen && <section className="admin-panel">
        <div className="section-heading"><div><p className="eyebrow">PRIVATE AREA</p><h2>لوحة الإدارة</h2></div><button className="text-button" onClick={() => setAdminOpen(false)}><X size={18}/> إغلاق</button></div>
        {!session ? <form className="admin-login" onSubmit={adminLogin}>
          <p>سجّل دخولك بحساب المدير. لازم تجهز حساب المدير وصلاحياته في Supabase قبل الاستخدام.</p>
          <input type="email" placeholder="البريد الإلكتروني" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} required/>
          <input type="password" placeholder="كلمة المرور" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} required/>
          <button className="primary-button" type="submit"><LogIn size={17}/> تسجيل الدخول</button>
        </form> : <div className="admin-content">
          <div className="admin-toolbar"><span><ShieldCheck size={18}/> تم تسجيل الدخول</span><button className="text-button" onClick={() => supabase.auth.signOut()}><LogOut size={16}/> خروج</button></div>
          <div className="admin-grid">
            <form className="admin-form" onSubmit={createProduct}>
              <h3><Plus size={18}/> إضافة منتج</h3>
              <input placeholder="اسم المنتج" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name:e.target.value})} required/>
              <input type="number" min="0" step="0.01" placeholder="السعر بالجنيه" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price:e.target.value})} required/>
              <input placeholder="رابط الصورة" value={newProduct.image_url} onChange={e => setNewProduct({...newProduct, image_url:e.target.value})}/>
              <input placeholder="الوصف" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description:e.target.value})}/>
              <input placeholder="المقاسات مفصولة بفواصل" value={newProduct.sizes} onChange={e => setNewProduct({...newProduct, sizes:e.target.value})}/>
              <input placeholder="الألوان مفصولة بفواصل" value={newProduct.colors} onChange={e => setNewProduct({...newProduct, colors:e.target.value})}/>
              <input type="number" min="0" placeholder="المخزون" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock:e.target.value})}/>
              <button className="primary-button" type="submit">حفظ المنتج</button>
            </form>
            <div className="orders-box">
              <h3><Package size={18}/> الطلبات</h3>
              <button className="secondary-button" onClick={loadOrders}><RefreshCw size={16}/> تحديث الطلبات</button>
              {adminOrders.map(order => <article className="order-card" key={order.id}>
                <strong>طلب #{order.id} — {money(order.total)}</strong><span>{order.customer_name} · {order.phone}</span><small>{order.address}</small>
                <select value={order.status} onChange={e => updateOrderStatus(order.id, e.target.value)}>
                  <option value="new">جديد</option><option value="confirmed">تم التأكيد</option><option value="shipped">تم الشحن</option><option value="delivered">تم التسليم</option><option value="cancelled">ملغي</option>
                </select>
              </article>)}
              {!adminOrders.length && <p className="muted">اضغط تحديث الطلبات لعرض الأوردرات.</p>}
            </div>
          </div>
        </div>}
      </section>}

      <section className="shop-section" id="shop">
        <div className="section-heading"><div><p className="eyebrow">THE FIRST DROP</p><h2>القطَع الأساسية<span>.</span></h2></div><p className="section-note">قطع مختارة للبس اليومي<br/>من TRIPLE Z</p></div>
        {!isSupabaseConfigured && <div className="setup-warning">دي معاينة تجريبية بمنتجات مؤقتة. هنربط قاعدة البيانات قبل استقبال أي طلبات فعلية.</div>}
        <div className="product-grid">{products.map((product, index) => {
          const opts = selected[product.id] || { size: product.sizes?.[0] || 'M', color: product.colors?.[0] || 'أسود' };
          return <article className="product-card" key={product.id}>
            <div className="product-image">
              {product.image_url ? <img src={product.image_url} alt={product.name} loading="lazy"/> : <Placeholder name={product.name}/>}
              <span className="product-index">TZ — {String(index + 1).padStart(2, '0')}</span>
            </div>
            <div className="product-info"><div><h3>{product.name}</h3><p>{product.description}</p></div><strong>{money(product.price)}</strong></div>
            <div className="product-options">
              <label>المقاس<select value={opts.size} onChange={e => setSelected({...selected, [product.id]: {...opts, size:e.target.value}})}>{(product.sizes?.length ? product.sizes : ['M']).map(s => <option key={s}>{s}</option>)}</select></label>
              <label>اللون<select value={opts.color} onChange={e => setSelected({...selected, [product.id]: {...opts, color:e.target.value}})}>{(product.colors?.length ? product.colors : ['أسود']).map(c => <option key={c}>{c}</option>)}</select></label>
            </div>
            <button className="add-button" disabled={Number(product.stock) <= 0} onClick={() => addToCart(product)}>{Number(product.stock) <= 0 ? 'غير متوفر' : 'أضف للسلة'} <Plus size={17}/></button>
          </article>;
        })}</div>
      </section>

      <section className="manifesto" id="about"><p className="eyebrow">MORE THAN A FIT</p><h2>NOT HERE TO<br/><span>BLEND IN.</span></h2><p>TRIPLE Z — هوية مستقلة، ستايل جريء، وتفاصيل معمولة عشان تفرق.</p></section>
      <section className="benefits"><div><ShieldCheck/><strong>اختيارات واضحة</strong><span>مقاسات وألوان لكل قطعة</span></div><div><Package/><strong>طلب منظم</strong><span>بيانات الطلب بتتسجل بأمان</span></div><div><ShoppingBag/><strong>ستايل TRIPLE Z</strong><span>Streetwear بطابع خاص</span></div></section>
    </main>

    <footer><a className="brand" href="#"><span>TRIPLE</span><b>Z</b></a><span>© 2026 TRIPLE Z. ALL RIGHTS RESERVED.</span><button className="text-button" onClick={() => setAdminOpen(true)}>ADMIN LOGIN</button></footer>

    {drawer && <div className="drawer-backdrop" onClick={() => setDrawer(false)}><aside className="cart-drawer" onClick={e => e.stopPropagation()}>
      <div className="drawer-heading"><div><p className="eyebrow">YOUR SELECTION</p><h2>سلة المشتريات</h2></div><button className="icon-button" onClick={() => setDrawer(false)}><X/></button></div>
      {!cart.length ? <div className="empty-cart"><ShoppingBag size={35}/><p>السلة لسه فاضية.</p><button className="secondary-button" onClick={() => setDrawer(false)}>كمّل تسوّق</button></div> : <>
        <div className="cart-items">{cart.map(item => <article className="cart-item" key={item.key}>
          <div className="cart-thumb">{item.image_url ? <img src={item.image_url} alt=""/> : <b>TZ</b>}</div>
          <div className="cart-item-details"><strong>{item.name}</strong><span>{item.size} / {item.color}</span><b>{money(item.price * item.quantity)}</b>
            <div className="qty-controls"><button onClick={() => changeQty(item.key, -1)}><Minus size={14}/></button><span>{item.quantity}</span><button onClick={() => changeQty(item.key, 1)}><Plus size={14}/></button></div>
          </div>
        </article>)}</div>
        <div className="cart-total"><span>الإجمالي</span><strong>{money(total)}</strong></div>
        {!checkout ? <button className="primary-button full-button" onClick={() => setCheckout(true)}>إتمام الطلب <ArrowUpRight size={18}/></button> : <form className="checkout-form" onSubmit={submitOrder}>
          <h3>بيانات التوصيل</h3>
          <input placeholder="الاسم بالكامل" value={form.customer_name} onChange={e => setForm({...form, customer_name:e.target.value})} required minLength="2"/>
          <input placeholder="رقم الموبايل" type="tel" value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} required minLength="8"/>
          <textarea placeholder="العنوان بالتفصيل والمحافظة" value={form.address} onChange={e => setForm({...form, address:e.target.value})} required minLength="8"/>
          <p className="muted">الدفع عند الاستلام — هنأكد الطلب قبل الشحن.</p>
          <button className="primary-button full-button" disabled={loading}>{loading ? 'جارٍ تسجيل الطلب...' : 'تأكيد الطلب — ' + money(total)}</button>
        </form>}
      </>}
    </aside></div>}
  </div>;
}
