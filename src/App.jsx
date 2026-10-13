
import React, { useEffect, useMemo, useState } from 'react';
import emailjs from '@emailjs/browser';
import {
  ShoppingBag, X, Plus, Minus, ArrowUpRight, ShieldCheck,
  Package, LogIn, LogOut, RefreshCw, MessageSquareWarning,
  Search, Send, ImagePlus, Trash2, UserRound, Languages
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from './supabase';

const demoProducts = [
  {
    id: 'demo-1', name: 'Z Shadow Hoodie',
    description: 'Oversized streetwear fit', price: 799,
    image_url: '', sizes: ['S', 'M', 'L', 'XL'],
    colors: ['أسود', 'أبيض'], stock: 10, is_active: true
  },
  {
    id: 'demo-2', name: 'Triple Line Sweatshirt',
    description: 'Everyday heavyweight style', price: 599,
    image_url: '', sizes: ['M', 'L', 'XL'],
    colors: ['أسود', 'رمادي'], stock: 8, is_active: true
  },
  {
    id: 'demo-3', name: 'Z Essential Tee',
    description: 'Clean graphic tee', price: 299,
    image_url: '', sizes: ['S', 'M', 'L', 'XL'],
    colors: ['أبيض', 'أسود'], stock: 15, is_active: true
  }
];

const money = n => `${Number(n || 0).toLocaleString('en-US')} ج.م`;

const translations = {
  'الرئيسية': { en: 'Home', fr: 'Accueil' },
  'المنتجات': { en: 'Products', fr: 'Produits' },
  'الشكاوى والتواصل': { en: 'Contact & Support', fr: 'Contact et assistance' },
  'تسوّق الآن': { en: 'Shop now', fr: 'Acheter' },
  'اكتشف المجموعة': { en: 'Explore collection', fr: 'Découvrir la collection' },
  'ابحث عن المنتجات...': { en: 'Search products...', fr: 'Rechercher des produits...' },
  'بحث': { en: 'Search', fr: 'Rechercher' },
  'أضف للسلة': { en: 'Add to cart', fr: 'Ajouter au panier' },
  'غير متوفر': { en: 'Out of stock', fr: 'Épuisé' },
  'سلة المشتريات': { en: 'Shopping cart', fr: 'Panier' },
  'السلة لسه فاضية.': { en: 'Your cart is empty.', fr: 'Votre panier est vide.' },
  'كمّل تسوّق': { en: 'Continue shopping', fr: 'Continuer les achats' },
  'إتمام الطلب': { en: 'Checkout', fr: 'Commander' },
  'بيانات التوصيل': { en: 'Delivery details', fr: 'Informations de livraison' },
  'الاسم بالكامل': { en: 'Full name', fr: 'Nom complet' },
  'رقم الموبايل': { en: 'Phone number', fr: 'Téléphone' },
  'العنوان بالتفصيل والمحافظة': { en: 'Full address and governorate', fr: 'Adresse complète et gouvernorat' },
  'الدفع عند الاستلام — هنأكد الطلب قبل الشحن.': { en: 'Cash on delivery — we will confirm before shipping.', fr: 'Paiement à la livraison — nous confirmerons avant expédition.' },
  'ابعتلنا رسالة': { en: 'Send us a message', fr: 'Envoyez-nous un message' },
  'نوع الرسالة': { en: 'Message type', fr: 'Type de message' },
  'تفاصيل الرسالة': { en: 'Message details', fr: 'Détails du message' },
  'إرسال الرسالة': { en: 'Send message', fr: 'Envoyer le message' },
  'دخول الإدارة': { en: 'Admin Login', fr: 'Connexion admin' },
  'تسجيل الدخول': { en: 'Sign in', fr: 'Se connecter' },
  'إنشاء حساب': { en: 'Create account', fr: 'Créer un compte' },
  'البريد الإلكتروني': { en: 'Email address', fr: 'Adresse e-mail' },
  'كلمة المرور': { en: 'Password', fr: 'Mot de passe' },
  'اسمك': { en: 'Your name', fr: 'Votre nom' },
  'طلب منظم': { en: 'Organized ordering', fr: 'Commande organisée' },
  'بيانات الطلب بتتسجل بأمان': { en: 'Your order details are handled securely.', fr: 'Vos informations de commande sont traitées en sécurité.' },
  'اختيارات واضحة': { en: 'Clear choices', fr: 'Choix clairs' },
  'مقاسات وألوان لكل قطعة': { en: 'Sizes and colors for every item', fr: 'Tailles et couleurs pour chaque article' },
  'ستايل TRIPLE Z': { en: 'TRIPLE Z style', fr: 'Style TRIPLE Z' },
  'Streetwear بطابع خاص': { en: 'Streetwear with its own identity', fr: 'Streetwear avec une identité unique' },
};

function translate(text, language) {
  if (language === 'ar') return text;
  return translations[text]?.[language] || text;
}
const allowedOrderStatuses = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled'];
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
  const [cart, setCart] = useState(() => {
    try {
      const saved = window.localStorage.getItem('triple-z-cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [language, setLanguage] = useState(() => {
    try { return window.localStorage.getItem('triple-z-language') || 'ar'; }
    catch { return 'ar'; }
  });
  const [customerAuthOpen, setCustomerAuthOpen] = useState(false);
  const [customerAuthMode, setCustomerAuthMode] = useState('login');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPassword, setCustomerPassword] = useState('');
  const [customerAuthLoading, setCustomerAuthLoading] = useState(false);
  const t = value => translate(value, language);
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

  const [customOpen, setCustomOpen] = useState(false);
  const [customFile, setCustomFile] = useState(null);
  const [customDescription, setCustomDescription] = useState('');
  const [customName, setCustomName] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [customLoading, setCustomLoading] = useState(false);

  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [complaintLoading, setComplaintLoading] = useState(false);

  const [adminOpen, setAdminOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [newProduct, setNewProduct] = useState({
    name: '', price: '', image_url: '', description: '',
    stock: '1', sizes: 'S,M,L,XL', colors: 'أسود,أبيض'
  });

  const [adminOrders, setAdminOrders] = useState([]);
  const [adminComplaints, setAdminComplaints] = useState([]);
  const [adminTab, setAdminTab] = useState('orders');

  const isAdmin = session?.user?.app_metadata?.role === 'admin';

  useEffect(() => {
    try { window.localStorage.setItem('triple-z-cart', JSON.stringify(cart)); }
    catch (error) { console.warn('Could not persist cart:', error); }
  }, [cart]);

  useEffect(() => {
    try { window.localStorage.setItem('triple-z-language', language); }
    catch (error) { console.warn('Could not persist language:', error); }
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  useEffect(() => {
    const handlePopState = () => {
      setPage(getCurrentPage());
      setNotice('');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function navigate(nextPage) {
    const paths = { home: '/', products: '/products', complaints: '/complaints' };
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
        if (mounted) setNotice('تعذر تحميل بيانات المتجر. حاول تحديث الصفحة.');
      } finally {
        if (mounted) setAuthLoading(false);
      }
    }

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => setSession(nextSession)
    );

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
    () => cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0),
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
          item.key === key ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [...old, {
        key,
        product_id: product.id,
        name: product.name,
        price: Number(product.price),
        image_url: product.image_url,
        size: options.size,
        color: options.color,
        quantity: 1
      }];
    });

    setNotice('اتضاف للسلة بنجاح.');
    setDrawer(true);
  }

  function changeQty(key, delta) {
    setCart(old => old
      .map(item => item.key === key
        ? { ...item, quantity: item.quantity + delta }
        : item
      )
      .filter(item => item.quantity > 0)
    );
  }

  async function submitCustomerAuth(e) {
    e.preventDefault();
    if (!supabase || !isSupabaseConfigured || customerAuthLoading) {
      setNotice('المتجر غير متصل بنظام الحسابات.');
      return;
    }
    if (customerPassword.length < 6) {
      setNotice('كلمة المرور لازم تكون 6 أحرف على الأقل.');
      return;
    }

    setCustomerAuthLoading(true);
    setNotice('');
    try {
      if (customerAuthMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: customerEmail.trim(),
          password: customerPassword,
          options: {
            data: { full_name: customerName.trim() }
          }
        });
        if (error) throw error;
        if (data.session) {
          setSession(data.session);
          setCustomerAuthOpen(false);
          setCustomerPassword('');
          setNotice('تم إنشاء الحساب وتسجيل الدخول بنجاح.');
        } else {
          setNotice('تم إنشاء الحساب. راجع بريدك الإلكتروني لتأكيده، ثم سجّل الدخول.');
          setCustomerAuthMode('login');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: customerEmail.trim(),
          password: customerPassword
        });
        if (error) throw error;
        setSession(data.session);
        setCustomerAuthOpen(false);
        setCustomerPassword('');
        setNotice('تم تسجيل الدخول بنجاح.');
      }
    } catch (error) {
      console.error('Customer authentication error:', error);
      setNotice(error.message || 'تعذر تسجيل الدخول. راجع بياناتك وحاول مرة أخرى.');
    } finally {
      setCustomerAuthLoading(false);
    }
  }

  async function customerLogout() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      setNotice('تعذر تسجيل الخروج. حاول مرة أخرى.');
      return;
    }
    setSession(null);
    setNotice('تم تسجيل الخروج.');
  }

  async function submitOrder(e) {
    e.preventDefault();
    if (loading) return;

    if (!cart.length) {
      setNotice('السلة فاضية. أضف منتجًا أولًا.');
      return;
    }

    if (!session || isAdmin) {
      setNotice('لازم تسجل دخول بحساب العميل قبل تأكيد الطلب.');
      setCustomerAuthMode('login');
      setCustomerAuthOpen(true);
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
      // لا تستخدم select بعد INSERT؛ الزائر لا يملك صلاحية قراءة الطلبات.
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

      setNotice(emailSent
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

  async function submitCustomDesign(e) {
    e.preventDefault();
    if (customLoading) return;

    if (!supabase || !isSupabaseConfigured) {
      setNotice('نظام الطلبات المخصصة غير متصل بقاعدة البيانات.');
      return;
    }

    if (customName.trim().length < 2 || customPhone.trim().length < 8) {
      setNotice('اكتب اسمك ورقم موبايل صحيح.');
      return;
    }

    if (!customFile) {
      setNotice('اختار صورة التصميم الأول.');
      return;
    }

    if (!customFile.type.startsWith('image/')) {
      setNotice('اختار ملف صورة صالح.');
      return;
    }

    if (customFile.size > 5 * 1024 * 1024) {
      setNotice('حجم الصورة لازم يكون 5 ميجابايت أو أقل.');
      return;
    }

    setCustomLoading(true);
    setNotice('');

    try {
      const safeName = customFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${Date.now()}-${safeName}`;

      // يتطلب إنشاء Storage bucket باسم custom-designs وضبط صلاحية الرفع.
      const { error: uploadError } = await supabase.storage
        .from('custom-designs')
        .upload(filePath, customFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Custom design upload error:', uploadError);
        setNotice('رفع الصورة لم ينجح. لازم نراجع إعدادات Storage في Supabase.');
        return;
      }

      const { data: publicData } = supabase.storage
        .from('custom-designs')
        .getPublicUrl(filePath);

      const imageUrl = publicData?.publicUrl;

      if (!imageUrl) {
        setNotice('الصورة اترفعت لكن تعذر الحصول على رابطها.');
        return;
      }

      const message = [
        'طلب تصميم مخصص من الموقع.',
        `تفاصيل العميل: ${customDescription.trim() || 'لم يضف تفاصيل.'}`,
        `صورة التصميم: ${imageUrl}`
      ].join('\n');

      const { error: insertError } = await supabase.from('complaints').insert({
        complaint_type: 'طلب تصميم مخصص',
        customer_name: customName.trim(),
        phone: customPhone.trim(),
        order_reference: null,
        message,
        status: 'new'
      });

      if (insertError) {
        console.error('Custom design request error:', insertError);
        setNotice(`الصورة اترفعت، لكن حفظ الطلب تعذر. احتفظ بالرابط: ${imageUrl}`);
        return;
      }

      setCustomOpen(false);
      setCustomFile(null);
      setCustomDescription('');
      setCustomName('');
      setCustomPhone('');
      setNotice('تم إرسال طلب التصميم المخصص بنجاح. فريق TRIPLE Z هيراجعه.');
    } catch (error) {
      console.error('Custom design error:', error);
      setNotice('حصل خطأ أثناء إرسال التصميم. حاول مرة تانية.');
    } finally {
      setCustomLoading(false);
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
      !name || !Number.isFinite(price) || price <= 0 ||
      !Number.isInteger(stock) || stock < 0
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
      name: '', price: '', image_url: '', description: '',
      stock: '1', sizes: 'S,M,L,XL', colors: 'أسود,أبيض'
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

  function renderProducts() {
    if (!filteredProducts.length) {
      return <p className="muted">مفيش منتجات مطابقة للبحث حاليًا.</p>;
    }

    return (
      <div className="product-grid">
        {filteredProducts.map((product, index) => {
          const opts = selected[product.id] || {
            size: product.sizes?.[0] || 'M',
            color: product.colors?.[0] || 'أسود'
          };

          return (
            <article className="product-card" key={product.id}>
              <div className="product-image">
                {product.image_url
                  ? <img src={product.image_url} alt={product.name} loading="lazy" />
                  : <Placeholder name={product.name} />
                }
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
                      ...old, [product.id]: { ...opts, size: e.target.value }
                    }))}
                  >
                    {(product.sizes?.length ? product.sizes : ['M']).map(size =>
                      <option key={size} value={size}>{size}</option>
                    )}
                  </select>
                </label>

                <label>
                  اللون
                  <select
                    value={opts.color}
                    onChange={e => setSelected(old => ({
                      ...old, [product.id]: { ...opts, color: e.target.value }
                    }))}
                  >
                    {(product.colors?.length ? product.colors : ['أسود']).map(color =>
                      <option key={color} value={color}>{color}</option>
                    )}
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
            <p>سجّل دخولك بحساب المدير المصرّح له داخل Supabase.</p>
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
                  type="number" min="0.01" step="0.01"
                  placeholder="السعر بالجنيه"
                  value={newProduct.price}
                  onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                  required
                />
                <input
                  type="url" placeholder="رابط الصورة"
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
                  type="number" min="0" step="1" placeholder="المخزون"
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
                      {allowedOrderStatuses.map(status =>
                        <option key={status} value={status}>{orderStatusLabels[status]}</option>
                      )}
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
                    <strong>رسالة #{complaint.id} — {complaint.complaint_type}</strong>
                    <span>{complaint.customer_name} · {complaint.phone}</span>
                    {complaint.order_reference && <small>رقم الطلب: {complaint.order_reference}</small>}
                    <p className="complaint-message" style={{ whiteSpace: 'pre-wrap' }}>
                      {complaint.message}
                    </p>
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
                        {complaintStatuses.map(status =>
                          <option key={status} value={status}>
                            {complaintStatusLabels[status]}
                          </option>
                        )}
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

        <nav className="page-nav" aria-label="القائمة الرئيسية">
          <a className={page === 'home' ? 'active' : ''} href="/"
            onClick={e => { e.preventDefault(); navigate('home'); }}>
            الرئيسية
          </a>
          <a className={page === 'products' ? 'active' : ''} href="/products"
            onClick={e => { e.preventDefault(); navigate('products'); }}>
            المنتجات
          </a>
          <a className={page === 'complaints' ? 'active' : ''} href="/complaints"
            onClick={e => { e.preventDefault(); navigate('complaints'); }}>
            الشكاوى والتواصل
          </a>
        </nav>

        <div className="header-actions">
          <label className="language-switch" aria-label="Language">
            <Languages size={16} />
            <select value={language} onChange={e => setLanguage(e.target.value)} aria-label="Choose language">
              <option value="ar">العربية</option>
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </label>
          {session && !isAdmin ? (
            <button className="customer-account-button" onClick={customerLogout} title={session.user?.email || ''}>
              <LogOut size={16} /> {language === 'ar' ? 'تسجيل الخروج' : language === 'fr' ? 'Déconnexion' : 'Sign out'}
            </button>
          ) : (
            <button className="customer-account-button" onClick={() => { setCustomerAuthMode('login'); setCustomerAuthOpen(true); }}>
              <UserRound size={16} /> {language === 'ar' ? 'حسابي' : language === 'fr' ? 'Mon compte' : 'My account'}
            </button>
          )}
          <button className="icon-button" aria-label="السلة" onClick={() => setDrawer(true)}>
            <ShoppingBag size={20} />
            {count > 0 && <span className="cart-count">{count}</span>}
          </button>
          <button className="admin-link" onClick={() => setAdminOpen(value => !value)}>
            <LogIn size={15} /> {t('دخول الإدارة')}
          </button>
        </div>
      </header>

      {notice && (
        <div className="notice" role="status">
          <span>{notice}</span>
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
                <div className="hero-actions">
                  <button className="primary-button" onClick={() => navigate('products')}>
                    تسوّق الآن <ArrowUpRight size={18} />
                  </button>
                  <button className="secondary-button" onClick={() => setCustomOpen(true)}>
                    <ImagePlus size={18} /> Customize Design
                  </button>
                </div>
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

            <section className="manifesto" id="about">
              <p className="eyebrow">MORE THAN A FIT</p>
              <h2>NOT HERE TO<br /><span>BLEND IN.</span></h2>
              <p>TRIPLE Z — هوية مستقلة، ستايل جريء، وتفاصيل معمولة عشان تفرق.</p>
              <button className="primary-button" onClick={() => navigate('products')}>
                اكتشف المجموعة <ArrowUpRight size={18} />
              </button>
            </section>

            <section className="benefits">
              <div><ShieldCheck /><strong>{t("اختيارات واضحة")}</strong><span>{t("مقاسات وألوان لكل قطعة")}</span></div>
              <div><Package /><strong>{t("طلب منظم")}</strong><span>{t("بيانات الطلب بتتسجل بأمان")}</span></div>
              <div><ShoppingBag /><strong>{t("ستايل TRIPLE Z")}</strong><span>{t("Streetwear بطابع خاص")}</span></div>
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

            <form className="product-search" onSubmit={e => e.preventDefault()}>
              <input
                type="search"
                placeholder={t("ابحث عن المنتجات...")}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                aria-label="البحث عن المنتجات"
              />
              {searchTerm && (
                <button type="button" className="search-clear"
                  onClick={() => setSearchTerm('')} aria-label="مسح البحث">
                  <X size={16} />
                </button>
              )}
              <button className="search-submit" type="submit" aria-label="بحث">
                <Search size={20} />
                <span>{t("بحث")}</span>
              </button>
            </form>

            {!isSupabaseConfigured && (
              <div className="setup-warning">
                دي معاينة تجريبية بمنتجات مؤقتة. قاعدة البيانات غير متصلة.
              </div>
            )}

            <div className="products-toolbar">
              <button className="secondary-button" onClick={() => setCustomOpen(true)}>
                <ImagePlus size={17} /> اطلب تصميمك الخاص
              </button>
            </div>

            {renderProducts()}
          </section>
        )}

        {page === 'complaints' && (
          <section className="complaints-page">
            <div className="page-intro complaints-intro">
              <p className="eyebrow">CONTACT TRIPLE Z</p>
              <h1>الشكاوى والتواصل<span>.</span></h1>
            </div>

            <form className="complaint-form" onSubmit={submitComplaint}>
              <h2>ابعتلنا رسالة</h2>

              <label>
                نوع الرسالة
                <select
                  value={complaintForm.complaint_type}
                  onChange={e => setComplaintForm({
                    ...complaintForm, complaint_type: e.target.value
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
                    ...complaintForm, customer_name: e.target.value
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
                    ...complaintForm, phone: e.target.value
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
                    ...complaintForm, order_reference: e.target.value
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
                    ...complaintForm, message: e.target.value
                  })}
                  placeholder="اكتب رسالتك هنا..."
                  minLength={5}
                  maxLength={3000}
                  rows={6}
                  required
                />
              </label>

              <button className="primary-button full-button" type="submit"
                disabled={complaintLoading}>
                {complaintLoading ? 'جارٍ الإرسال...' : 'إرسال الرسالة'}
                <Send size={17} />
              </button>
            </form>
          </section>
        )}
      </main>

      <footer className="site-footer">
        <a className="brand" href="/" onClick={e => { e.preventDefault(); navigate('home'); }}>
          <span>TRIPLE</span><b>Z</b>
        </a>
        <div className="footer-links">
          <a href="/" onClick={e => { e.preventDefault(); navigate('home'); }}>الرئيسية</a>
          <a href="/products" onClick={e => { e.preventDefault(); navigate('products'); }}>المنتجات</a>
          <a href="/complaints" onClick={e => { e.preventDefault(); navigate('complaints'); }}>الشكاوى والتواصل</a>
        </div>
        <span>© 2026 TRIPLE Z. ALL RIGHTS RESERVED.</span>
        <button className="admin-footer-link" onClick={() => setAdminOpen(true)}>
          <LogIn size={15} /> Admin Login
        </button>
      </footer>

      {customerAuthOpen && (
        <div className="drawer-backdrop auth-backdrop" onClick={() => setCustomerAuthOpen(false)}>
          <section className="customer-auth-modal" onClick={e => e.stopPropagation()}>
            <div className="drawer-heading">
              <div>
                <p className="eyebrow">TRIPLE Z ACCOUNT</p>
                <h2>{customerAuthMode === 'signup'
                  ? (language === 'ar' ? 'إنشاء حساب جديد' : language === 'fr' ? 'Créer un compte' : 'Create your account')
                  : (language === 'ar' ? 'تسجيل الدخول' : language === 'fr' ? 'Connexion' : 'Sign in')}</h2>
              </div>
              <button className="icon-button" onClick={() => setCustomerAuthOpen(false)} aria-label="Close">
                <X />
              </button>
            </div>
            <p className="muted">
              {language === 'ar'
                ? 'سجّل دخولك أو أنشئ حسابًا قبل تأكيد طلبك.'
                : language === 'fr'
                  ? 'Connectez-vous ou créez un compte avant de confirmer votre commande.'
                  : 'Sign in or create an account before confirming your order.'}
            </p>
            <form className="customer-auth-form" onSubmit={submitCustomerAuth}>
              {customerAuthMode === 'signup' && (
                <label>
                  {language === 'ar' ? 'الاسم بالكامل' : language === 'fr' ? 'Nom complet' : 'Full name'}
                  <input value={customerName} onChange={e => setCustomerName(e.target.value)} minLength={2} required autoComplete="name" />
                </label>
              )}
              <label>
                {language === 'ar' ? 'البريد الإلكتروني' : language === 'fr' ? 'Adresse e-mail' : 'Email address'}
                <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} required autoComplete="email" />
              </label>
              <label>
                {language === 'ar' ? 'كلمة المرور (6 أحرف على الأقل)' : language === 'fr' ? 'Mot de passe (6 caractères minimum)' : 'Password (at least 6 characters)'}
                <input type="password" value={customerPassword} onChange={e => setCustomerPassword(e.target.value)} minLength={6} required autoComplete={customerAuthMode === 'signup' ? 'new-password' : 'current-password'} />
              </label>
              <button className="primary-button full-button" type="submit" disabled={customerAuthLoading}>
                {customerAuthLoading
                  ? (language === 'ar' ? 'جارٍ المعالجة...' : language === 'fr' ? 'Traitement...' : 'Please wait...')
                  : customerAuthMode === 'signup'
                    ? (language === 'ar' ? 'إنشاء حساب' : language === 'fr' ? 'Créer un compte' : 'Create account')
                    : (language === 'ar' ? 'تسجيل الدخول' : language === 'fr' ? 'Se connecter' : 'Sign in')}
              </button>
            </form>
            <button className="auth-mode-toggle" type="button" onClick={() => setCustomerAuthMode(mode => mode === 'login' ? 'signup' : 'login')}>
              {customerAuthMode === 'login'
                ? (language === 'ar' ? 'ليس لديك حساب؟ إنشاء حساب' : language === 'fr' ? 'Pas de compte ? Créer un compte' : "Don't have an account? Create one")
                : (language === 'ar' ? 'لديك حساب بالفعل؟ تسجيل الدخول' : language === 'fr' ? 'Déjà un compte ? Se connecter' : 'Already have an account? Sign in')}
            </button>
          </section>
        </div>
      )}

      {customOpen && (
        <div className="drawer-backdrop custom-backdrop" onClick={() => setCustomOpen(false)}>
          <section className="custom-modal" onClick={e => e.stopPropagation()}>
            <div className="drawer-heading">
              <div>
                <p className="eyebrow">YOUR IDEA / OUR STYLE</p>
                <h2>Customize Design</h2>
              </div>
              <button className="icon-button" onClick={() => setCustomOpen(false)}
                aria-label="إغلاق">
                <X />
              </button>
            </div>

            <p className="muted">
              ارفع صورة التصميم اللي في بالك واكتب تفاصيله، وفريق TRIPLE Z هيراجع طلبك.
            </p>

            <form className="custom-form" onSubmit={submitCustomDesign}>
              <label>
                الاسم بالكامل
                <input value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder="اكتب اسمك" minLength={2} required />
              </label>

              <label>
                رقم الموبايل
                <input type="tel" value={customPhone}
                  onChange={e => setCustomPhone(e.target.value)}
                  placeholder="01xxxxxxxxx" minLength={8} required />
              </label>

              <label className="custom-upload">
                <ImagePlus size={24} />
                <strong>{customFile ? customFile.name : 'اختار صورة التصميم'}</strong>
                <span>PNG أو JPG — بحد أقصى 5 ميجابايت</span>
                <input type="file" accept="image/*"
                  onChange={e => setCustomFile(e.target.files?.[0] || null)}
                  required />
              </label>

              {customFile && (
                <div className="selected-file">
                  <span>{customFile.name}</span>
                  <button type="button" onClick={() => setCustomFile(null)}
                    aria-label="إزالة الصورة">
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              <label>
                تفاصيل التصميم
                <textarea value={customDescription}
                  onChange={e => setCustomDescription(e.target.value)}
                  placeholder="مثلاً: لون الهودي، مكان التصميم، المقاس..."
                  maxLength={1500} rows={4} />
              </label>

              <button className="primary-button full-button" type="submit"
                disabled={customLoading}>
                {customLoading ? 'جارٍ إرسال طلبك...' : 'إرسال طلب التصميم'}
                <Send size={17} />
              </button>
            </form>
          </section>
        </div>
      )}

      {drawer && (
        <div className="drawer-backdrop" onClick={() => setDrawer(false)}>
          <aside className="cart-drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-heading">
              <div>
                <p className="eyebrow">YOUR SELECTION</p>
                <h2>{t('سلة المشتريات')}</h2>
              </div>
              <button className="icon-button" onClick={() => setDrawer(false)}
                aria-label="إغلاق السلة">
                <X />
              </button>
            </div>

            {!cart.length ? (
              <div className="empty-cart">
                <ShoppingBag size={35} />
                <p>{t('السلة لسه فاضية.')}</p>
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
                          <button onClick={() => changeQty(item.key, -1)} aria-label="تقليل الكمية">
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
                          }} aria-label="زيادة الكمية">
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
                  <button className="primary-button full-button" onClick={() => {
                    setCheckout(true);
                    if (!session || isAdmin) {
                      setCustomerAuthMode('login');
                      setCustomerAuthOpen(true);
                    }
                  }}>
                    {t('إتمام الطلب')} <ArrowUpRight size={18} />
                  </button>
                ) : (
                  <form className="checkout-form" onSubmit={submitOrder}>
                    <h3>{t('بيانات التوصيل')}</h3>
                    <input placeholder={t("الاسم بالكامل")} value={form.customer_name}
                      onChange={e => setForm({ ...form, customer_name: e.target.value })}
                      required minLength={2} />
                    <input placeholder={t("رقم الموبايل")} type="tel" value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      required minLength={8} />
                    <textarea placeholder={language === "ar" ? "العنوان بالتفصيل والمحافظة" : language === "fr" ? "Adresse complète et gouvernorat" : "Full address and governorate"} value={form.address}
                      onChange={e => setForm({ ...form, address: e.target.value })}
                      required minLength={8} />
                    <p className="muted">{t("الدفع عند الاستلام — هنأكد الطلب قبل الشحن.")}</p>
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
