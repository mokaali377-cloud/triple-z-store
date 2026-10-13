
import React, { useEffect, useMemo, useState } from 'react';
import emailjs from '@emailjs/browser';
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  ArrowUpRight,
  ShieldCheck,
  Package,
  LogIn,
  LogOut,
  RefreshCw,
  House,
  MessageSquareWarning,
  Search,
  Send,
  Shirt
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from './supabase';

const demoProducts = [
  {
    id: 'demo-1',
    name: 'Z Shadow Hoodie',
    description: 'Oversized streetwear fit',
    price: 799,
    image_url: '',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['أسود', 'أبيض'],
    stock: 10,
    is_active: true
  },
  {
    id: 'demo-2',
    name: 'Triple Line Sweatshirt',
    description: 'Everyday heavyweight style',
    price: 599,
    image_url: '',
    sizes: ['M', 'L', 'XL'],
    colors: ['أسود', 'رمادي'],
    stock: 8,
    is_active: true
  },
  {
    id: 'demo-3',
    name: 'Z Essential Tee',
    description: 'Clean graphic tee',
    price: 299,
    image_url: '',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['أبيض', 'أسود'],
    stock: 15,
    is_active: true
  }
];

const money = n => `${Number(n || 0).toLocaleString('en-US')} ج.م`;

const allowedOrderStatuses = [
  'new', 'confirmed', 'shipped', 'delivered', 'cancelled'
];

const complaintStatuses = ['new', 'in_review', 'resolved'];

const complaintStatusLabels = {
  new: 'جديدة',
  in_review: 'قيد المراجعة',
  resolved: 'تم الحل'
};

const orderStatusLabels = {
  new: 'جديد',
  confirmed: 'تم التأكيد',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي'
};

function Placeholder({ name }) {
  return (
    <div className="product-placeholder">
      <span>TRIPLE</span>
      <strong>Z</strong>
      <small>{name}</small>
    </div>
  );
}

function getCurrentPage() {
  const path = window.location.pathname.replace(/\/+$/, '');
  if (path.endsWith('/products')) return 'products';
  if (path.endsWith('/complaints')) return 'complaints';
  return 'home';
}

export default function App() {
  const [page, setPage] = useState(getCurrentPage);
  const [products, setProducts] = useState(demoProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [drawer, setDrawer] = useState(false);
  const [selected, setSelected] = useState({});
  const [checkout, setCheckout] = useState(false);

  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    address: ''
  });

  const [complaintForm, setComplaintForm] = useState({
    complaint_type: 'شكوى بخصوص طلب',
    customer_name: '',
    phone: '',
    order_reference: '',
    message: ''
  });

  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [complaintLoading, setComplaintLoading] = useState(false);

  const [adminOpen, setAdminOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    image_url: '',
    description: '',
    stock: '1',
    sizes: 'S,M,L,XL',
    colors: 'أسود,أبيض'
  });

  const [adminOrders, setAdminOrders] = useState([]);
  const [adminComplaints, setAdminComplaints] = useState([]);
  const [adminTab, setAdminTab] = useState('orders');

  const isAdmin = session?.user?.app_metadata?.role === 'admin';

  useEffect(() => {
    const handlePopState = () => {
      setPage(getCurrentPage());
      setNotice('');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function navigate(nextPage) {
    const paths = {
      home: '/',
      products: '/products',
      complaints: '/complaints'
    };

    const target = paths[nextPage] || '/';
    if (window.location.pathname !== target) {
      window.history.pushState({}, '', target);
    }

    setPage(nextPage);
    setNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthLoading(false);
      return;
    }

    let mounted = true;

    async function initialize() {
      try {
        await loadProducts();

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (mounted) setSession(data.session);
      } catch (error) {
        console.error('Initialization error:', error);
        if (mounted) {
          setNotice('تعذر تحميل بيانات المتجر. حاول تحديث الصفحة.');
        }
      } finally {
        if (mounted) setAuthLoading(false);
      }
    }

    initialize();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isAdmin && adminOpen) {
      loadOrders();
      loadComplaints();
    }
  }, [isAdmin, adminOpen]);

  async function loadProducts() {
    if (!supabase) return;

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Load products error:', error);
      return;
    }

    if (data) setProducts(data);
  }

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return products;

    return products.filter(product =>
      `${product.name || ''} ${product.description || ''}`
        .toLowerCase()
        .includes(term)
    );
  }, [products, searchTerm]);

  const total = useMemo(
    () => cart.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    ),
    [cart]
  );

  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  function addToCart(product) {
    if (Number(product.stock) <= 0) {
      setNotice('المنتج غير متوفر حاليًا.');
      return;
    }

    const options = selected[product.id] || {
      size: product.sizes?.[0] || 'M',
      color: product.colors?.[0] || 'أسود'
    };

    const key = `${product.id}-${options.size}-${options.color}`;
    const sameProductQuantity = cart
      .filter(item => item.product_id === product.id)
      .reduce((sum, item) => sum + item.quantity, 0);

    if (sameProductQuantity >= Number(product.stock)) {
      setNotice('الكمية المطلوبة أكبر من المخزون المتاح.');
      return;
    }

    setCart(old => {
      const found = old.find(item => item.key === key);

      if (found) {
        return old.map(item =>
          item.key === key
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...old,
        {
          key,
          product_id: product.id,
          name: product.name,
          price: Number(product.price),
          image_url: product.image_url,
          size: options.size,
          color: options.color,
          quantity: 1
        }
      ];
    });

    setNotice('اتضاف للسلة بنجاح.');
    setDrawer(true);
  }

  function changeQty(key, delta) {
    setCart(old =>
      old
        .map(item =>
          item.key === key
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  }

  async function submitOrder(e) {
    e.preventDefault();
    if (loading) return;

    if (!cart.length) {
      setNotice('السلة فاضية. أضف منتجًا أولًا.');
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setNotice('المتجر غير متصل بقاعدة البيانات.');
      return;
    }

    const customerName = form.customer_name.trim();
    const phone = form.phone.trim();
    const address = form.address.trim();

    if (customerName.length < 2 || phone.length < 8 || address.length < 8) {
      setNotice('راجع الاسم ورقم الموبايل والعنوان.');
      return;
    }

    setLoading(true);
    setNotice('');

    const payload = {
      customer_name: customerName,
      phone,
      address,
      items: cart.map(({ product_id, name, price, size, color, quantity }) => ({
        product_id, name, price, size, color, quantity
      })),
      total,
      status: 'new'
    };

    const orderReference = `TZ-${Date.now()}`;

    try {
      // الزائر لديه INSERT فقط، لذلك لا نطلب SELECT بعد الحفظ.
      const { error } = await supabase.from('orders').insert(payload);

      if (error) {
        console.error('Supabase order error:', error);
        setNotice('ماقدرناش نسجل الطلب. حاول مرة تانية.');
        return;
      }

      const orderItems = payload.items.map(item =>
        `${item.name} | المقاس: ${item.size} | اللون: ${item.color} | الكمية: ${item.quantity} | سعر القطعة: ${item.price} جنيه`
      ).join('\n');

      let emailSent = false;

      try {
        await emailjs.send(
          'service_sr1rp78',
          'template_j6d9i67',
          {
            customer_name: payload.customer_name,
            phone: payload.phone,
            address: payload.address,
            order_id: orderReference,
            order_items: orderItems,
            total: payload.total
          },
          'hiGURebO6S2IhbOwv'
        );
        emailSent = true;
      } catch (emailError) {
        console.error('EmailJS notification error:', emailError);
      }

      setCart([]);
      setCheckout(false);
      setDrawer(false);
      setForm({ customer_name: '', phone: '', address: '' });

      setNotice(
        emailSent
          ? `تم تسجيل طلبك بنجاح! الرقم المرجعي ${orderReference}، واتبعث إشعار Gmail.`
          : `تم تسجيل الطلب بنجاح! الرقم المرجعي ${orderReference}، لكن إشعار Gmail ماتبعتش.`
      );
    } catch (error) {
      console.error('Submit order error:', error);
      setNotice('حصل خطأ أثناء تسجيل الطلب. حاول مرة تانية.');
    } finally {
      setLoading(false);
    }
  }

  async function submitComplaint(e) {
    e.preventDefault();
    if (complaintLoading) return;

    if (!supabase || !isSupabaseConfigured) {
      setNotice('نظام الشكاوى غير متصل بقاعدة البيانات.');
      return;
    }

    const payload = {
      complaint_type: complaintForm.complaint_type,
      customer_name: complaintForm.customer_name.trim(),
      phone: complaintForm.phone.trim(),
      order_reference: complaintForm.order_reference.trim() || null,
      message: complaintForm.message.trim(),
      status: 'new'
    };

    if (
      payload.customer_name.length < 2 ||
      payload.phone.length < 8 ||
      payload.message.length < 5
    ) {
      setNotice('راجع الاسم ورقم الموبايل وتفاصيل الرسالة.');
      return;
    }

    setComplaintLoading(true);
    setNotice('');

    try {
      // لا نستخدم select هنا؛ العميل لا يحتاج صلاحية قراءة الشكاوى.
      const { error } = await supabase.from('complaints').insert(payload);

      if (error) {
        console.error('Submit complaint error:', error);
        setNotice('تعذر إرسال الرسالة. حاول مرة تانية.');
        return;
      }

      setComplaintForm({
        complaint_type: 'شكوى بخصوص طلب',
        customer_name: '',
        phone: '',
        order_reference: '',
        message: ''
      });

      setNotice('تم إرسال رسالتك بنجاح. فريق TRIPLE Z هيراجعها.');
    } catch (error) {
      console.error('Complaint submission error:', error);
      setNotice('حصل خطأ أثناء إرسال الرسالة.');
    } finally {
      setComplaintLoading(false);
    }
  }

  async function adminLogin(e) {
    e.preventDefault();
    if (!supabase || authLoading) return;

    setNotice('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: adminEmail.trim(),
        password: adminPassword
      });

      if (error) {
        setNotice('بيانات الدخول غير صحيحة أو تعذر تسجيل الدخول.');
        return;
      }

      const loggedInSession = data.session;
      const role = loggedInSession?.user?.app_metadata?.role;

      if (role !== 'admin') {
        await supabase.auth.signOut();
        setSession(null);
        setNotice('الحساب ده مش مخوّل لإدارة المتجر.');
        return;
      }

      setSession(loggedInSession);
      setAdminPassword('');
      setNotice('تم تسجيل دخول المدير بنجاح.');
    } catch (error) {
      console.error('Admin login error:', error);
      setNotice('حصل خطأ أثناء تسجيل الدخول.');
    }
  }

  async function adminLogout() {
    if (!supabase) return;

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Admin logout error:', error);
      setNotice('تعذر تسجيل الخروج. حاول مرة تانية.');
      return;
    }

    setSession(null);
    setAdminOrders([]);
    setAdminComplaints([]);
    setNotice('تم تسجيل الخروج.');
  }

  async function loadOrders() {
    if (!supabase || !isAdmin) {
      setNotice('غير مسموح بعرض الطلبات.');
      return;
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Load orders error:', error);
      setNotice('تعذر تحميل الطلبات. راجع صلاحيات حساب الإدارة.');
      return;
    }

    setAdminOrders(data || []);
  }

  async function loadComplaints() {
    if (!supabase || !isAdmin) {
      setNotice('غير مسموح بعرض الشكاوى.');
      return;
    }

    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Load complaints error:', error);
      setNotice('تعذر تحميل الشكاوى. راجع صلاحيات حساب الإدارة.');
      return;
    }

    setAdminComplaints(data || []);
  }

  async function updateComplaintStatus(id, status) {
    if (!supabase || !isAdmin) {
      setNotice('غير مسموح بتعديل الشكاوى.');
      return;
    }

    if (!complaintStatuses.includes(status)) {
      setNotice('حالة الشكوى غير صحيحة.');
      return;
    }

    const { error } = await supabase
      .from('complaints')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Update complaint error:', error);
      setNotice('تعذر تحديث حالة الشكوى.');
      return;
    }

    setNotice('تم تحديث حالة الشكوى.');
    await loadComplaints();
  }

  async function createProduct(e) {
    e.preventDefault();

    if (!supabase || !isAdmin) {
      setNotice('غير مسموح بإضافة المنتجات.');
      return;
    }

    const name = newProduct.name.trim();
    const price = Number(newProduct.price);
    const stock = Number(newProduct.stock);

    if (
      !name ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      setNotice('راجع اسم المنتج والسعر والمخزون.');
      return;
    }

    const product = {
      name,
      price,
      image_url: newProduct.image_url.trim() || null,
      description: newProduct.description.trim(),
      stock,
      sizes: newProduct.sizes.split(',').map(v => v.trim()).filter(Boolean),
      colors: newProduct.colors.split(',').map(v => v.trim()).filter(Boolean),
      is_active: true
    };

    const { error } = await supabase.from('products').insert(product);

    if (error) {
      console.error('Create product error:', error);
      setNotice('تعذر إضافة المنتج. تأكد من صلاحيات المدير.');
      return;
    }

    setNotice('تمت إضافة المنتج بنجاح.');

    setNewProduct({
      name: '',
      price: '',
      image_url: '',
      description: '',
      stock: '1',
      sizes: 'S,M,L,XL',
      colors: 'أسود,أبيض'
    });

    await loadProducts();
  }

  async function updateOrderStatus(id, status) {
    if (!supabase || !isAdmin) {
      setNotice('غير مسموح بتعديل الطلبات.');
      return;
    }

    if (!allowedOrderStatuses.includes(status)) {
      setNotice('حالة الطلب غير صحيحة.');
      return;
    }

    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Update order error:', error);
      setNotice('تعذر تحديث حالة الطلب.');
      return;
    }

    setNotice('تم تحديث حالة الطلب.');
    await loadOrders();
  }

  function renderProducts(limit = null) {
    const shownProducts = limit
      ? filteredProducts.slice(0, limit)
      : filteredProducts;

    if (!shownProducts.length) {
      return <p className="muted">مفيش منتجات مطابقة للبحث حاليًا.</p>;
    }

    return (
      <div className="product-grid">
        {shownProducts.map((product, index) => {
          const opts = selected[product.id] || {
            size: product.sizes?.[0] || 'M',
            color: product.colors?.[0] || 'أسود'
          };

          return (
            <article className="product-card" key={product.id}>
              <div className="product-image">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} loading="lazy" />
                ) : (
                  <Placeholder name={product.name} />
                )}
                <span className="product-index">
                  TZ — {String(index + 1).padStart(2, '0')}
                </span>
              </div>

              <div className="product-info">
                <div>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                </div>
                <strong>{money(product.price)}</strong>
              </div>

              <div className="product-options">
                <label>
                  المقاس
                  <select
                    value={opts.size}
                    onChange={e => setSelected(old => ({
                      ...old,
                      [product.id]: { ...opts, size: e.target.value }
                    }))}
                  >
                    {(product.sizes?.length ? product.sizes : ['M']).map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </label>
                <label>
                  اللون
                  <select
                    value={opts.color}
                    onChange={e => setSelected(old => ({
                      ...old,
                      [product.id]: { ...opts, color: e.target.value }
                    }))}
                  >
                    {(product.colors?.length ? product.colors : ['أسود']).map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </label>
              </div>

              <button
                className="add-button"
                disabled={Number(product.stock) <= 0}
                onClick={() => addToCart(product)}
              >
                {Number(product.stock) <= 0 ? 'غير متوفر' : 'أضف للسلة'}
                <Plus size={17} />
              </button>
            </article>
          );
        })}
      </div>
    );
  }

  function renderAdminPanel() {
    return (
      <section className="admin-panel" id="admin">
        <div className="section-heading">
          <div>
            <p className="eyebrow">PRIVATE AREA</p>
            <h2>لوحة الإدارة</h2>
          </div>
          <button className="text-button" onClick={() => setAdminOpen(false)}>
            <X size={18} /> إغلاق
          </button>
        </div>

        {authLoading ? (
          <p className="muted">جارٍ التحقق من تسجيل الدخول...</p>
        ) : !session ? (
          <form className="admin-login" onSubmit={adminLogin}>
            <p>
              سجّل دخولك بحساب المدير. يجب أن يكون دور الحساب admin
              في App Metadata داخل Supabase.
            </p>
            <input
              type="email"
              placeholder="البريد الإلكتروني"
              value={adminEmail}
              onChange={e => setAdminEmail(e.target.value)}
              autoComplete="username"
              required
            />
            <input
              type="password"
              placeholder="كلمة المرور"
              value={adminPassword}
              onChange={e => setAdminPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button className="primary-button" type="submit">
              <LogIn size={17} /> تسجيل الدخول
            </button>
          </form>
        ) : !isAdmin ? (
          <div className="admin-login">
            <p>الحساب الحالي غير مخوّل لإدارة المتجر.</p>
            <button className="secondary-button" onClick={adminLogout}>
              <LogOut size={16} /> تسجيل الخروج
            </button>
          </div>
        ) : (
          <div className="admin-content">
            <div className="admin-toolbar">
              <span><ShieldCheck size={18} /> تم التحقق من دور المدير</span>
              <button className="text-button" onClick={adminLogout}>
                <LogOut size={16} /> خروج
              </button>
            </div>

            <div className="admin-tabs">
              <button
                className={adminTab === 'orders' ? 'active' : ''}
                onClick={() => setAdminTab('orders')}
              >
                <Package size={16} /> الطلبات
              </button>
              <button
                className={adminTab === 'complaints' ? 'active' : ''}
                onClick={() => setAdminTab('complaints')}
              >
                <MessageSquareWarning size={16} /> الشكاوى
                <span>{adminComplaints.filter(c => c.status === 'new').length}</span>
              </button>
              <button
                className={adminTab === 'products' ? 'active' : ''}
                onClick={() => setAdminTab('products')}
              >
                <Plus size={16} /> إضافة منتج
              </button>
            </div>

            {adminTab === 'products' && (
              <form className="admin-form admin-product-form" onSubmit={createProduct}>
                <h3><Plus size={18} /> إضافة منتج</h3>
                <input
                  placeholder="اسم المنتج"
                  value={newProduct.name}
                  onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                  required
                />
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="السعر بالجنيه"
                  value={newProduct.price}
                  onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                  required
                />
                <input
                  type="url"
                  placeholder="رابط الصورة"
                  value={newProduct.image_url}
                  onChange={e => setNewProduct({ ...newProduct, image_url: e.target.value })}
                />
                <input
                  placeholder="الوصف"
                  value={newProduct.description}
                  onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                />
                <input
                  placeholder="المقاسات مفصولة بفواصل"
                  value={newProduct.sizes}
                  onChange={e => setNewProduct({ ...newProduct, sizes: e.target.value })}
                />
                <input
                  placeholder="الألوان مفصولة بفواصل"
                  value={newProduct.colors}
                  onChange={e => setNewProduct({ ...newProduct, colors: e.target.value })}
                />
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="المخزون"
                  value={newProduct.stock}
                  onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })}
                />
                <button className="primary-button" type="submit">حفظ المنتج</button>
              </form>
            )}

            {adminTab === 'orders' && (
              <div className="orders-box">
                <div className="admin-list-heading">
                  <h3><Package size={18} /> الطلبات</h3>
                  <button className="secondary-button" onClick={loadOrders}>
                    <RefreshCw size={16} /> تحديث
                  </button>
                </div>

                {adminOrders.map(order => (
                  <article className="order-card" key={order.id}>
                    <strong>طلب #{order.id} — {money(order.total)}</strong>
                    <span>{order.customer_name} · {order.phone}</span>
                    <small>{order.address}</small>
                    <select
                      value={order.status}
                      onChange={e => updateOrderStatus(order.id, e.target.value)}
                    >
                      {allowedOrderStatuses.map(status => (
                        <option key={status} value={status}>
                          {orderStatusLabels[status]}
                        </option>
                      ))}
                    </select>
                  </article>
                ))}

                {!adminOrders.length && (
                  <p className="muted">لا توجد طلبات محملة. اضغط تحديث.</p>
                )}
              </div>
            )}

            {adminTab === 'complaints' && (
              <div className="orders-box">
                <div className="admin-list-heading">
                  <h3><MessageSquareWarning size={18} /> الشكاوى والتواصل</h3>
                  <button className="secondary-button" onClick={loadComplaints}>
                    <RefreshCw size={16} /> تحديث
                  </button>
                </div>

                {adminComplaints.map(complaint => (
                  <article className="order-card complaint-admin-card" key={complaint.id}>
                    <strong>
                      رسالة #{complaint.id} — {complaint.complaint_type}
                    </strong>
                    <span>{complaint.customer_name} · {complaint.phone}</span>
                    {complaint.order_reference && (
                      <small>رقم الطلب: {complaint.order_reference}</small>
                    )}
                    <p className="complaint-message">{complaint.message}</p>
                    <small>
                      {complaint.created_at
                        ? new Date(complaint.created_at).toLocaleString('ar-EG')
                        : ''}
                    </small>
                    <label className="status-field">
                      حالة المتابعة
                      <select
                        value={complaint.status}
                        onChange={e => updateComplaintStatus(complaint.id, e.target.value)}
                      >
                        {complaintStatuses.map(status => (
                          <option key={status} value={status}>
                            {complaintStatusLabels[status]}
                          </option>
                        ))}
                      </select>
                    </label>
                  </article>
                ))}

                {!adminComplaints.length && (
                  <p className="muted">لا توجد شكاوى محملة. اضغط تحديث.</p>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="app-shell">
      <div className="topline">DROP 01 — STREETWEAR FOR YOUR OWN LANE</div>

      <header className="site-header">
        <a className="brand" href="/" onClick={e => { e.preventDefault(); navigate('home'); }}>
          <span>TRIPLE</span><b>Z</b>
        </a>

        <nav>
          <a href="/" onClick={e => { e.preventDefault(); navigate('home'); }}>
            الرئيسية
          </a>
          <a href="/products" onClick={e => { e.preventDefault(); navigate('products'); }}>
            المنتجات
          </a>
          <a href="/complaints" onClick={e => { e.preventDefault(); navigate('complaints'); }}>
            الشكاوى والتواصل
          </a>
        </nav>

        <div className="header-actions">
          <button className="icon-button" aria-label="السلة" onClick={() => setDrawer(true)}>
            <ShoppingBag size={20} />
            <span className="cart-count">{count}</span>
          </button>
          <button className="admin-link" onClick={() => setAdminOpen(value => !value)}>
            الإدارة
          </button>
        </div>
      </header>

      {notice && (
        <div className="notice" role="status">
          {notice}
          <button onClick={() => setNotice('')} aria-label="إغلاق التنبيه">
            <X size={16} />
          </button>
        </div>
      )}

      {adminOpen && renderAdminPanel()}

      <main>
        {page === 'home' && (
          <>
            <section className="hero">
              <div className="hero-copy">
                <p className="eyebrow">NEW SEASON / 2026</p>
                <h1>OWN YOUR<br /><em>LANE.</em></h1>
                <p className="hero-text">
                  ستايل شبابي. تفاصيل مختلفة. اختار القطعة اللي شبهك.
                </p>
                <button className="primary-button" onClick={() => navigate('products')}>
                  تسوّق الآن <ArrowUpRight size={18} />
                </button>
                <div className="hero-foot">
                  <span>01 / ORIGINAL STREETWEAR</span>
                  <span>TRIPLE Z®</span>
                </div>
              </div>

              <div className="hero-art" aria-label="TRIPLE Z brand artwork">
                <div className="art-grid" />
                <div className="art-circle" />
                <div className="art-cross">✳</div>
                <div className="art-type">NO<br />RULES<span>.</span></div>
                <div className="art-stamp">TZ / 001<br />EST. 2026</div>
              </div>
            </section>

            <section className="shop-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">THE FIRST DROP</p>
                  <h2>اختيارات من المجموعة<span>.</span></h2>
                </div>
                <button className="text-button" onClick={() => navigate('products')}>
                  عرض كل المنتجات <ArrowUpRight size={16} />
                </button>
              </div>
              {!isSupabaseConfigured && (
                <div className="setup-warning">
                  دي معاينة تجريبية بمنتجات مؤقتة. قاعدة البيانات غير متصلة.
                </div>
              )}
              {renderProducts(3)}
            </section>

            <section className="manifesto" id="about">
              <p className="eyebrow">MORE THAN A FIT</p>
              <h2>NOT HERE TO<br /><span>BLEND IN.</span></h2>
              <p>TRIPLE Z — هوية مستقلة، ستايل جريء، وتفاصيل معمولة عشان تفرق.</p>
              <button className="primary-button" onClick={() => navigate('products')}>
                اكتشف المجموعة <ArrowUpRight size={18} />
              </button>
            </section>

            <section className="benefits">
              <div><ShieldCheck /><strong>اختيارات واضحة</strong><span>مقاسات وألوان لكل قطعة</span></div>
              <div><Package /><strong>طلب منظم</strong><span>بيانات الطلب بتتسجل بأمان</span></div>
              <div><ShoppingBag /><strong>ستايل TRIPLE Z</strong><span>Streetwear بطابع خاص</span></div>
            </section>
          </>
        )}

        {page === 'products' && (
          <section className="shop-section products-page">
            <div className="page-intro">
              <p className="eyebrow">TRIPLE Z COLLECTION</p>
              <h1>المنتجات<span>.</span></h1>
              <p>اختار القطعة والمقاس واللون المناسب ليك.</p>
            </div>

            <div className="product-search">
              <Search size={19} />
              <input
                type="search"
                placeholder="ابحث عن منتج..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                aria-label="البحث عن المنتجات"
              />
              {searchTerm && (
                <button className="text-button" onClick={() => setSearchTerm('')}>
                  مسح
                </button>
              )}
            </div>

            {!isSupabaseConfigured && (
              <div className="setup-warning">
                دي معاينة تجريبية بمنتجات مؤقتة. قاعدة البيانات غير متصلة.
              </div>
            )}

            <p className="results-count">عدد المنتجات: {filteredProducts.length}</p>
            {renderProducts()}
          </section>
        )}

        {page === 'complaints' && (
          <section className="complaints-page">
            <div className="page-intro">
              <p className="eyebrow">WE'RE HERE TO HELP</p>
              <h1>الشكاوى والتواصل<span>.</span></h1>
              <p>واجهت مشكلة في طلبك أو عندك استفسار؟ ابعتلنا رسالتك.</p>
            </div>

            <div className="complaints-layout">
              <div className="complaint-info">
                <MessageSquareWarning size={35} />
                <h2>خلّينا نساعدك.</h2>
                <p>
                  اكتب بياناتك وتفاصيل المشكلة. الرسالة هتوصل لفريق الإدارة
                  لمراجعتها ومتابعتها.
                </p>
                <div className="complaint-step">
                  <span>01</span><p>إرسال الرسالة</p>
                </div>
                <div className="complaint-step">
                  <span>02</span><p>مراجعة فريق TRIPLE Z</p>
                </div>
                <div className="complaint-step">
                  <span>03</span><p>تحديث حالة المتابعة</p>
                </div>
              </div>

              <form className="complaint-form" onSubmit={submitComplaint}>
                <h2>ابعتلنا رسالة</h2>

                <label>
                  نوع الرسالة
                  <select
                    value={complaintForm.complaint_type}
                    onChange={e => setComplaintForm({
                      ...complaintForm,
                      complaint_type: e.target.value
                    })}
                  >
                    <option>شكوى بخصوص طلب</option>
                    <option>تأخير في التوصيل</option>
                    <option>مشكلة في منتج</option>
                    <option>استفسار</option>
                    <option>اقتراح</option>
                    <option>نوع آخر</option>
                  </select>
                </label>

                <label>
                  الاسم بالكامل
                  <input
                    value={complaintForm.customer_name}
                    onChange={e => setComplaintForm({
                      ...complaintForm,
                      customer_name: e.target.value
                    })}
                    placeholder="اكتب اسمك"
                    minLength={2}
                    maxLength={100}
                    required
                  />
                </label>

                <label>
                  رقم الموبايل
                  <input
                    type="tel"
                    value={complaintForm.phone}
                    onChange={e => setComplaintForm({
                      ...complaintForm,
                      phone: e.target.value
                    })}
                    placeholder="01xxxxxxxxx"
                    minLength={8}
                    maxLength={25}
                    required
                  />
                </label>

                <label>
                  رقم الطلب <span className="optional-label">(اختياري)</span>
                  <input
                    value={complaintForm.order_reference}
                    onChange={e => setComplaintForm({
                      ...complaintForm,
                      order_reference: e.target.value
                    })}
                    placeholder="مثال: TZ-123456"
                    maxLength={100}
                  />
                </label>

                <label>
                  تفاصيل الرسالة
                  <textarea
                    value={complaintForm.message}
                    onChange={e => setComplaintForm({
                      ...complaintForm,
                      message: e.target.value
                    })}
                    placeholder="اشرح لنا المشكلة أو استفسارك بالتفصيل..."
                    minLength={5}
                    maxLength={3000}
                    rows={6}
                    required
                  />
                </label>

                <button
                  className="primary-button full-button"
                  type="submit"
                  disabled={complaintLoading}
                >
                  {complaintLoading ? 'جارٍ الإرسال...' : 'إرسال الرسالة'}
                  <Send size={17} />
                </button>
                <p className="muted">
                  بياناتك تُستخدم لمتابعة رسالتك فقط. لا تشارك أي كلمات مرور أو بيانات دفع.
                </p>
              </form>
            </div>
          </section>
        )}
      </main>

      <footer>
        <a className="brand" href="/" onClick={e => { e.preventDefault(); navigate('home'); }}>
          <span>TRIPLE</span><b>Z</b>
        </a>
        <div className="footer-links">
          <a href="/" onClick={e => { e.preventDefault(); navigate('home'); }}>
            الرئيسية
          </a>
          <a href="/products" onClick={e => { e.preventDefault(); navigate('products'); }}>
            المنتجات
          </a>
          <a href="/complaints" onClick={e => { e.preventDefault(); navigate('complaints'); }}>
            الشكاوى والتواصل
          </a>
        </div>
        <span>© 2026 TRIPLE Z. ALL RIGHTS RESERVED.</span>
        <button className="text-button" onClick={() => setAdminOpen(true)}>
          ADMIN LOGIN
        </button>
      </footer>

      {drawer && (
        <div className="drawer-backdrop" onClick={() => setDrawer(false)}>
          <aside className="cart-drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-heading">
              <div>
                <p className="eyebrow">YOUR SELECTION</p>
                <h2>سلة المشتريات</h2>
              </div>
              <button className="icon-button" onClick={() => setDrawer(false)}>
                <X />
              </button>
            </div>

            {!cart.length ? (
              <div className="empty-cart">
                <ShoppingBag size={35} />
                <p>السلة لسه فاضية.</p>
                <button className="secondary-button" onClick={() => {
                  setDrawer(false);
                  navigate('products');
                }}>
                  كمّل تسوّق
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map(item => (
                    <article className="cart-item" key={item.key}>
                      <div className="cart-thumb">
                        {item.image_url ? <img src={item.image_url} alt="" /> : <b>TZ</b>}
                      </div>
                      <div className="cart-item-details">
                        <strong>{item.name}</strong>
                        <span>{item.size} / {item.color}</span>
                        <b>{money(item.price * item.quantity)}</b>
                        <div className="qty-controls">
                          <button onClick={() => changeQty(item.key, -1)}>
                            <Minus size={14} />
                          </button>
                          <span>{item.quantity}</span>
                          <button onClick={() => {
                            const product = products.find(p => p.id === item.product_id);
                            if (!product) return;

                            const quantity = cart
                              .filter(i => i.product_id === item.product_id)
                              .reduce((sum, i) => sum + i.quantity, 0);

                            if (quantity >= Number(product.stock)) {
                              setNotice('الكمية المطلوبة أكبر من المخزون المتاح.');
                              return;
                            }

                            changeQty(item.key, 1);
                          }}>
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="cart-total">
                  <span>الإجمالي</span>
                  <strong>{money(total)}</strong>
                </div>

                {!checkout ? (
                  <button className="primary-button full-button" onClick={() => setCheckout(true)}>
                    إتمام الطلب <ArrowUpRight size={18} />
                  </button>
                ) : (
                  <form className="checkout-form" onSubmit={submitOrder}>
                    <h3>بيانات التوصيل</h3>
                    <input
                      placeholder="الاسم بالكامل"
                      value={form.customer_name}
                      onChange={e => setForm({ ...form, customer_name: e.target.value })}
                      required
                      minLength={2}
                    />
                    <input
                      placeholder="رقم الموبايل"
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      required
                      minLength={8}
                    />
                    <textarea
                      placeholder="العنوان بالتفصيل والمحافظة"
                      value={form.address}
                      onChange={e => setForm({ ...form, address: e.target.value })}
                      required
                      minLength={8}
                    />
                    <p className="muted">الدفع عند الاستلام — هنأكد الطلب قبل الشحن.</p>
                    <button className="primary-button full-button" type="submit" disabled={loading}>
                      {loading ? 'جارٍ تسجيل الطلب...' : `تأكيد الطلب — ${money(total)}`}
                    </button>
                  </form>
                )}
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
