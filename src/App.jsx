
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

const money = (n, language = 'ar') => {
  const amount = Number(n || 0).toLocaleString('en-US');
  const currency = language === 'ar' ? 'ج.م' : 'EGP';
  return `${amount} ${currency}`;
};

const translations = {
  'الرئيسية': { en: 'Home', fr: 'Accueil' , de: 'Startseite'},
  'المنتجات': { en: 'Products', fr: 'Produits' , de: 'Produkte'},
  'الشكاوى والتواصل': { en: 'Contact & Support', fr: 'Contact et assistance' , de: 'Kontakt & Support'},
  'تسوّق الآن': { en: 'Shop now', fr: 'Acheter' , de: 'Jetzt einkaufen'},
  'اكتشف المجموعة': { en: 'Explore collection', fr: 'Découvrir la collection' , de: 'Kollektion entdecken'},
  'ابحث عن المنتجات...': { en: 'Search products...', fr: 'Rechercher des produits...' , de: 'Produkte suchen...'},
  'بحث': { en: 'Search', fr: 'Rechercher' , de: 'Suchen'},
  'أضف للسلة': { en: 'Add to cart', fr: 'Ajouter au panier' , de: 'In den Warenkorb'},
  'غير متوفر': { en: 'Out of stock', fr: 'Épuisé' , de: 'Nicht verfügbar'},
  'سلة المشتريات': { en: 'Shopping cart', fr: 'Panier' , de: 'Warenkorb'},
  'السلة لسه فاضية.': { en: 'Your cart is empty.', fr: 'Votre panier est vide.' , de: 'Dein Warenkorb ist leer.'},
  'كمّل تسوّق': { en: 'Continue shopping', fr: 'Continuer les achats' , de: 'Weiter einkaufen'},
  'إتمام الطلب': { en: 'Checkout', fr: 'Commander' , de: 'Zur Kasse'},
  'بيانات التوصيل': { en: 'Delivery details', fr: 'Informations de livraison' , de: 'Lieferdaten'},
  'الاسم بالكامل': { en: 'Full name', fr: 'Nom complet' , de: 'Vollständiger Name'},
  'رقم الموبايل': { en: 'Phone number', fr: 'Téléphone' , de: 'Telefonnummer'},
  'العنوان بالتفصيل والمحافظة': { en: 'Full address and governorate', fr: 'Adresse complète et gouvernorat' , de: 'Vollständige Adresse und Gouvernement'},
  'الدفع عند الاستلام — هنأكد الطلب قبل الشحن.': { en: 'Cash on delivery — we will confirm before shipping.', fr: 'Paiement à la livraison — nous confirmerons avant expédition.' , de: 'Nachnahme – wir bestätigen die Bestellung vor dem Versand.'},
  'ابعتلنا رسالة': { en: 'Send us a message', fr: 'Envoyez-nous un message' , de: 'Schreib uns'},
  'نوع الرسالة': { en: 'Message type', fr: 'Type de message' , de: 'Nachrichtentyp'},
  'تفاصيل الرسالة': { en: 'Message details', fr: 'Détails du message' , de: 'Nachrichtendetails'},
  'إرسال الرسالة': { en: 'Send message', fr: 'Envoyer le message' , de: 'Nachricht senden'},
  'دخول الإدارة': { en: 'Admin Login', fr: 'Connexion admin' , de: 'Admin-Anmeldung'},
  'تسجيل الدخول': { en: 'Sign in', fr: 'Se connecter' , de: 'Anmelden'},
  'إنشاء حساب': { en: 'Create account', fr: 'Créer un compte' , de: 'Konto erstellen'},
  'البريد الإلكتروني': { en: 'Email address', fr: 'Adresse e-mail' , de: 'E-Mail-Adresse'},
  'كلمة المرور': { en: 'Password', fr: 'Mot de passe' , de: 'Passwort'},
  'اسمك': { en: 'Your name', fr: 'Votre nom' , de: 'Dein Name'},
  'طلب منظم': { en: 'Organized ordering', fr: 'Commande organisée' , de: 'Strukturierte Bestellung'},
  'بيانات الطلب بتتسجل بأمان': { en: 'Your order details are handled securely.', fr: 'Vos informations de commande sont traitées en sécurité.' , de: 'Deine Bestelldaten werden sicher verarbeitet.'},
  'اختيارات واضحة': { en: 'Clear choices', fr: 'Choix clairs' , de: 'Klare Auswahl'},
  'مقاسات وألوان لكل قطعة': { en: 'Sizes and colors for every item', fr: 'Tailles et couleurs pour chaque article' , de: 'Größen und Farben für jedes Produkt'},
  'ستايل TRIPLE Z': { en: 'TRIPLE Z style', fr: 'Style TRIPLE Z' , de: 'TRIPLE-Z-Stil'},
  'Streetwear بطابع خاص': { en: 'Streetwear with its own identity', fr: 'Streetwear avec une identité unique' , de: 'Streetwear mit eigener Identität'},

  'المتجر غير متصل بنظام الحسابات.': { en: 'The account system is not connected.', fr: 'Le système de compte n’est pas connecté.', de: 'Das Kontosystem ist nicht verbunden.' },
  'كلمة المرور لازم تكون 6 أحرف على الأقل.': { en: 'Password must be at least 6 characters.', fr: 'Le mot de passe doit contenir au moins 6 caractères.', de: 'Das Passwort muss mindestens 6 Zeichen lang sein.' },
  'ستايل شبابي. تفاصيل مختلفة. اختار القطعة اللي شبهك.': { en: 'Youthful style. Distinct details. Choose the piece that feels like you.', fr: 'Un style jeune. Des détails uniques. Choisissez la pièce qui vous ressemble.', de: 'Junger Stil. Besondere Details. Finde das Teil, das zu dir passt.' },
  'اختار القطعة والمقاس واللون المناسب ليك.': { en: 'Choose the piece, size, and color that suit you.', fr: 'Choisissez la pièce, la taille et la couleur qui vous conviennent.', de: 'Wähle das passende Produkt, die Größe und die Farbe.' },
  'المنتجات.': { en: 'Products.', fr: 'Produits.', de: 'Produkte.' },
  'الشكاوى والتواصل.': { en: 'Contact & Support.', fr: 'Contact et assistance.', de: 'Kontakt & Support.' },
  'مفيش منتجات مطابقة للبحث حاليًا.': { en: 'No matching products found.', fr: 'Aucun produit correspondant.', de: 'Keine passenden Produkte gefunden.' },
  'اطلب تصميمك الخاص': { en: 'Request your custom design', fr: 'Demander votre design personnalisé', de: 'Eigenes Design anfragen' },
  'ابعتلنا رسالة': { en: 'Send us a message', fr: 'Envoyez-nous un message', de: 'Schreib uns eine Nachricht' },
  'شكوى بخصوص طلب': { en: 'Order complaint', fr: 'Réclamation concernant une commande', de: 'Beschwerde zu einer Bestellung' },
  'تأخير في التوصيل': { en: 'Delivery delay', fr: 'Retard de livraison', de: 'Lieferverzögerung' },
  'مشكلة في منتج': { en: 'Product issue', fr: 'Problème de produit', de: 'Produktproblem' },
  'استفسار': { en: 'Question', fr: 'Question', de: 'Frage' },
  'اقتراح': { en: 'Suggestion', fr: 'Suggestion', de: 'Vorschlag' },
  'نوع آخر': { en: 'Other', fr: 'Autre', de: 'Sonstiges' },
  'اكتب اسمك': { en: 'Enter your name', fr: 'Entrez votre nom', de: 'Gib deinen Namen ein' },
  'رقم الطلب': { en: 'Order reference', fr: 'Référence de commande', de: 'Bestellnummer' },
  'اكتب رسالتك هنا...': { en: 'Write your message here...', fr: 'Écrivez votre message ici...', de: 'Schreibe deine Nachricht hier...' },
  'جارٍ الإرسال...': { en: 'Sending...', fr: 'Envoi...', de: 'Wird gesendet...' },
  'الإجمالي': { en: 'Total', fr: 'Total', de: 'Gesamt' },
  'المقاس': { en: 'Size', fr: 'Taille', de: 'Größe' },
  'اللون': { en: 'Color', fr: 'Couleur', de: 'Farbe' },
  'إغلاق': { en: 'Close', fr: 'Fermer', de: 'Schließen' },
  'اختار صورة التصميم': { en: 'Choose a design image', fr: 'Choisir une image du design', de: 'Designbild auswählen' },
  'تفاصيل التصميم': { en: 'Design details', fr: 'Détails du design', de: 'Designdetails' },
  'إرسال طلب التصميم': { en: 'Submit design request', fr: 'Envoyer la demande de design', de: 'Designanfrage senden' },
  'لوحة الإدارة': { en: 'Admin panel', fr: 'Panneau d’administration', de: 'Adminbereich' },
  'إغلاق': { en: 'Close', fr: 'Fermer', de: 'Schließen' },
  'جارٍ التحقق من تسجيل الدخول...': { en: 'Checking sign-in...', fr: 'Vérification de la connexion...', de: 'Anmeldung wird überprüft...' },
  'سجّل دخولك بحساب المدير المصرّح له داخل Supabase.': { en: 'Sign in with the authorized admin account in Supabase.', fr: 'Connectez-vous avec le compte administrateur autorisé dans Supabase.', de: 'Melde dich mit dem autorisierten Administratorkonto in Supabase an.' },
  'الحساب الحالي غير مخوّل لإدارة المتجر.': { en: 'This account is not authorized to manage the store.', fr: 'Ce compte n’est pas autorisé à gérer la boutique.', de: 'Dieses Konto ist nicht zur Verwaltung des Shops berechtigt.' },
  'تم التحقق من دور المدير': { en: 'Admin role verified', fr: 'Rôle administrateur vérifié', de: 'Adminrolle bestätigt' },
  'خروج': { en: 'Sign out', fr: 'Déconnexion', de: 'Abmelden' },
  'الطلبات': { en: 'Orders', fr: 'Commandes', de: 'Bestellungen' },
  'الشكاوى': { en: 'Complaints', fr: 'Réclamations', de: 'Beschwerden' },
  'إضافة منتج': { en: 'Add product', fr: 'Ajouter un produit', de: 'Produkt hinzufügen' },
  'اسم المنتج': { en: 'Product name', fr: 'Nom du produit', de: 'Produktname' },
  'السعر بالجنيه': { en: 'Price in EGP', fr: 'Prix en EGP', de: 'Preis in EGP' },
  'رابط الصورة': { en: 'Image URL', fr: 'URL de l’image', de: 'Bild-URL' },
  'الوصف': { en: 'Description', fr: 'Description', de: 'Beschreibung' },
  'المقاسات مفصولة بفواصل': { en: 'Sizes separated by commas', fr: 'Tailles séparées par des virgules', de: 'Größen durch Kommas trennen' },
  'الألوان مفصولة بفواصل': { en: 'Colors separated by commas', fr: 'Couleurs séparées par des virgules', de: 'Farben durch Kommas trennen' },
  'المخزون': { en: 'Stock', fr: 'Stock', de: 'Lagerbestand' },
  'حفظ المنتج': { en: 'Save product', fr: 'Enregistrer le produit', de: 'Produkt speichern' },
  'تحديث': { en: 'Refresh', fr: 'Actualiser', de: 'Aktualisieren' },
  'لا توجد طلبات محملة. اضغط تحديث.': { en: 'No orders loaded. Click Refresh.', fr: 'Aucune commande chargée. Cliquez sur Actualiser.', de: 'Keine Bestellungen geladen. Klicke auf Aktualisieren.' },
  'حالة المتابعة': { en: 'Follow-up status', fr: 'État du suivi', de: 'Bearbeitungsstatus' },
  'لا توجد شكاوى محملة. اضغط تحديث.': { en: 'No complaints loaded. Click Refresh.', fr: 'Aucune réclamation chargée. Cliquez sur Actualiser.', de: 'Keine Beschwerden geladen. Klicke auf Aktualisieren.' },
  'ستايل شبابي. تفاصيل مختلفة. اختار القطعة اللي شبهك.': { en: 'Youthful style. Distinct details. Choose the piece that feels like you.', fr: 'Un style jeune. Des détails uniques. Choisissez la pièce qui vous ressemble.', de: 'Junger Stil. Besondere Details. Finde das Teil, das zu dir passt.' },
  'هوية مستقلة، ستايل جريء، وتفاصيل معمولة عشان تفرق.': { en: 'An independent identity, bold style, and details that stand out.', fr: 'Une identité indépendante, un style audacieux et des détails qui se démarquent.', de: 'Eine eigenständige Identität, ein mutiger Stil und besondere Details.' },
  'اختار القطعة والمقاس واللون المناسب ليك.': { en: 'Choose the piece, size, and color that suit you.', fr: 'Choisissez la pièce, la taille et la couleur qui vous conviennent.', de: 'Wähle das passende Produkt, die Größe und die Farbe.' },
  'البحث عن المنتجات': { en: 'Search products', fr: 'Rechercher des produits', de: 'Produkte suchen' },
  'مسح البحث': { en: 'Clear search', fr: 'Effacer la recherche', de: 'Suche löschen' },
  'دي معاينة تجريبية بمنتجات مؤقتة. قاعدة البيانات غير متصلة.': { en: 'This is a demo preview with temporary products. The database is not connected.', fr: 'Ceci est un aperçu de démonstration avec des produits temporaires. La base de données n’est pas connectée.', de: 'Dies ist eine Vorschau mit temporären Produkten. Die Datenbank ist nicht verbunden.' },
  'مثال: TZ-123456': { en: 'Example: TZ-123456', fr: 'Exemple : TZ-123456', de: 'Beispiel: TZ-123456' },
  'اختياري': { en: 'Optional', fr: 'Facultatif', de: 'Optional' },
  'ارفع صورة التصميم اللي في بالك واكتب تفاصيله، وفريق TRIPLE Z هيراجع طلبك.': { en: 'Upload your design image and describe it. The TRIPLE Z team will review your request.', fr: 'Téléversez l’image de votre design et décrivez-le. L’équipe TRIPLE Z examinera votre demande.', de: 'Lade dein Designbild hoch und beschreibe es. Das TRIPLE-Z-Team prüft deine Anfrage.' },
  'PNG أو JPG — بحد أقصى 5 ميجابايت': { en: 'PNG or JPG — up to 5 MB', fr: 'PNG ou JPG — 5 Mo maximum', de: 'PNG oder JPG — maximal 5 MB' },
  'إزالة الصورة': { en: 'Remove image', fr: 'Supprimer l’image', de: 'Bild entfernen' },
  'مثلاً: لون الهودي، مكان التصميم، المقاس...': { en: 'For example: hoodie color, design placement, size...', fr: 'Exemple : couleur du sweat, emplacement du design, taille...', de: 'Zum Beispiel: Hoodie-Farbe, Position des Designs, Größe...' },
  'جارٍ إرسال طلبك...': { en: 'Submitting your request...', fr: 'Envoi de votre demande...', de: 'Anfrage wird gesendet...' },
  'إغلاق السلة': { en: 'Close cart', fr: 'Fermer le panier', de: 'Warenkorb schließen' },
  'تقليل الكمية': { en: 'Decrease quantity', fr: 'Diminuer la quantité', de: 'Menge verringern' },
  'زيادة الكمية': { en: 'Increase quantity', fr: 'Augmenter la quantité', de: 'Menge erhöhen' },
  'المنتج غير متوفر حاليًا.': { en: 'This product is currently unavailable.', fr: 'Ce produit est actuellement indisponible.', de: 'Dieses Produkt ist derzeit nicht verfügbar.' },
  'الكمية المطلوبة أكبر من المخزون المتاح.': { en: 'Requested quantity exceeds available stock.', fr: 'La quantité demandée dépasse le stock disponible.', de: 'Die gewünschte Menge übersteigt den verfügbaren Bestand.' },
  'اتضاف للسلة بنجاح.': { en: 'Added to cart successfully.', fr: 'Ajouté au panier.', de: 'Erfolgreich in den Warenkorb gelegt.' },
  'السلة فاضية. أضف منتجًا أولًا.': { en: 'Your cart is empty. Add a product first.', fr: 'Votre panier est vide. Ajoutez d’abord un produit.', de: 'Dein Warenkorb ist leer. Füge zuerst ein Produkt hinzu.' },
  'لازم تسجل دخول بحساب العميل قبل تأكيد الطلب.': { en: 'Sign in with your customer account before confirming the order.', fr: 'Connectez-vous à votre compte client avant de confirmer la commande.', de: 'Melde dich vor der Bestätigung mit deinem Kundenkonto an.' },
  'راجع الاسم ورقم الموبايل والعنوان.': { en: 'Check the name, phone number, and address.', fr: 'Vérifiez le nom, le numéro de téléphone et l’adresse.', de: 'Bitte überprüfe Name, Telefonnummer und Adresse.' },
  'ماقدرناش نسجل الطلب. حاول مرة تانية.': { en: 'We could not save the order. Please try again.', fr: 'Impossible d’enregistrer la commande. Réessayez.', de: 'Die Bestellung konnte nicht gespeichert werden. Bitte versuche es erneut.' },
  'حصل خطأ أثناء تسجيل الطلب. حاول مرة تانية.': { en: 'An error occurred while submitting the order. Please try again.', fr: 'Une erreur est survenue lors de la commande. Réessayez.', de: 'Beim Absenden der Bestellung ist ein Fehler aufgetreten. Bitte versuche es erneut.' },
  'راجع الاسم ورقم الموبايل وتفاصيل الرسالة.': { en: 'Check your name, phone number, and message details.', fr: 'Vérifiez votre nom, votre téléphone et les détails du message.', de: 'Bitte überprüfe Name, Telefonnummer und Nachricht.' },
  'تعذر إرسال الرسالة. حاول مرة تانية.': { en: 'Could not send the message. Please try again.', fr: 'Impossible d’envoyer le message. Réessayez.', de: 'Nachricht konnte nicht gesendet werden. Bitte versuche es erneut.' },
  'تم إرسال رسالتك بنجاح. فريق TRIPLE Z هيراجعها.': { en: 'Your message was sent successfully. The TRIPLE Z team will review it.', fr: 'Votre message a été envoyé. L’équipe TRIPLE Z l’examinera.', de: 'Deine Nachricht wurde gesendet. Das TRIPLE-Z-Team wird sie prüfen.' },
  'حصل خطأ أثناء إرسال الرسالة.': { en: 'An error occurred while sending the message.', fr: 'Une erreur est survenue lors de l’envoi du message.', de: 'Beim Senden der Nachricht ist ein Fehler aufgetreten.' },
  'نظام الشكاوى غير متصل بقاعدة البيانات.': { en: 'The support system is not connected to the database.', fr: 'Le système d’assistance n’est pas connecté à la base de données.', de: 'Das Supportsystem ist nicht mit der Datenbank verbunden.' },
  'نظام الطلبات المخصصة غير متصل بقاعدة البيانات.': { en: 'Custom requests are not connected to the database.', fr: 'Les demandes personnalisées ne sont pas connectées à la base de données.', de: 'Individuelle Anfragen sind nicht mit der Datenbank verbunden.' },
  'اكتب اسمك ورقم موبايل صحيح.': { en: 'Enter your name and a valid phone number.', fr: 'Saisissez votre nom et un numéro de téléphone valide.', de: 'Gib deinen Namen und eine gültige Telefonnummer ein.' },
  'اختار صورة التصميم الأول.': { en: 'Choose a design image first.', fr: 'Choisissez d’abord une image du design.', de: 'Wähle zuerst ein Designbild aus.' },
  'اختار ملف صورة صالح.': { en: 'Choose a valid image file.', fr: 'Choisissez un fichier image valide.', de: 'Wähle eine gültige Bilddatei aus.' },
  'حجم الصورة لازم يكون 5 ميجابايت أو أقل.': { en: 'The image must be 5 MB or smaller.', fr: 'L’image doit faire 5 Mo ou moins.', de: 'Das Bild darf höchstens 5 MB groß sein.' },
  'رفع الصورة لم ينجح. لازم نراجع إعدادات Storage في Supabase.': { en: 'Image upload failed. Check Supabase Storage settings.', fr: 'Échec du téléversement. Vérifiez les paramètres Storage de Supabase.', de: 'Bild-Upload fehlgeschlagen. Prüfe die Supabase-Storage-Einstellungen.' },
  'الصورة اترفعت لكن تعذر الحصول على رابطها.': { en: 'The image uploaded, but its URL could not be retrieved.', fr: 'L’image a été téléversée, mais son URL est introuvable.', de: 'Das Bild wurde hochgeladen, aber die URL konnte nicht abgerufen werden.' },
  'تم إرسال طلب التصميم المخصص بنجاح. فريق TRIPLE Z هيراجعه.': { en: 'Custom design request sent successfully. The TRIPLE Z team will review it.', fr: 'Demande de design envoyée. L’équipe TRIPLE Z l’examinera.', de: 'Designanfrage erfolgreich gesendet. Das TRIPLE-Z-Team wird sie prüfen.' },
  'حصل خطأ أثناء إرسال التصميم. حاول مرة تانية.': { en: 'An error occurred while sending the design. Please try again.', fr: 'Une erreur est survenue lors de l’envoi du design. Réessayez.', de: 'Beim Senden des Designs ist ein Fehler aufgetreten. Bitte versuche es erneut.' },
  'بيانات الدخول غير صحيحة أو تعذر تسجيل الدخول.': { en: 'Invalid credentials or sign-in failed.', fr: 'Identifiants incorrects ou échec de connexion.', de: 'Ungültige Anmeldedaten oder Anmeldung fehlgeschlagen.' },
  'الحساب ده مش مخوّل لإدارة المتجر.': { en: 'This account is not authorized to manage the store.', fr: 'Ce compte n’est pas autorisé à gérer la boutique.', de: 'Dieses Konto darf den Shop nicht verwalten.' },
  'حصل خطأ أثناء تسجيل الدخول.': { en: 'An error occurred while signing in.', fr: 'Une erreur est survenue lors de la connexion.', de: 'Beim Anmelden ist ein Fehler aufgetreten.' },
  'غير مسموح بعرض الطلبات.': { en: 'You are not allowed to view orders.', fr: 'Vous n’êtes pas autorisé à consulter les commandes.', de: 'Du darfst Bestellungen nicht ansehen.' },
  'تعذر تحميل الطلبات. راجع صلاحيات حساب الإدارة.': { en: 'Could not load orders. Check admin permissions.', fr: 'Impossible de charger les commandes. Vérifiez les droits administrateur.', de: 'Bestellungen konnten nicht geladen werden. Prüfe die Admin-Berechtigungen.' },
  'غير مسموح بعرض الشكاوى.': { en: 'You are not allowed to view complaints.', fr: 'Vous n’êtes pas autorisé à consulter les réclamations.', de: 'Du darfst Beschwerden nicht ansehen.' },
  'تعذر تحميل الشكاوى. راجع صلاحيات حساب الإدارة.': { en: 'Could not load complaints. Check admin permissions.', fr: 'Impossible de charger les réclamations. Vérifiez les droits administrateur.', de: 'Beschwerden konnten nicht geladen werden. Prüfe die Admin-Berechtigungen.' },
  'غير مسموح بتعديل الشكاوى.': { en: 'You are not allowed to update complaints.', fr: 'Vous n’êtes pas autorisé à modifier les réclamations.', de: 'Du darfst Beschwerden nicht ändern.' },
  'حالة الشكوى غير صحيحة.': { en: 'Invalid complaint status.', fr: 'Statut de réclamation invalide.', de: 'Ungültiger Beschwerdestatus.' },
  'تعذر تحديث حالة الشكوى.': { en: 'Could not update complaint status.', fr: 'Impossible de mettre à jour le statut.', de: 'Beschwerdestatus konnte nicht aktualisiert werden.' },
  'تم تحديث حالة الشكوى.': { en: 'Complaint status updated.', fr: 'Statut de réclamation mis à jour.', de: 'Beschwerdestatus aktualisiert.' },
  'غير مسموح بإضافة المنتجات.': { en: 'You are not allowed to add products.', fr: 'Vous n’êtes pas autorisé à ajouter des produits.', de: 'Du darfst keine Produkte hinzufügen.' },
  'راجع اسم المنتج والسعر والمخزون.': { en: 'Check the product name, price, and stock.', fr: 'Vérifiez le nom, le prix et le stock du produit.', de: 'Prüfe Produktname, Preis und Lagerbestand.' },
  'تعذر إضافة المنتج. تأكد من صلاحيات المدير.': { en: 'Could not add product. Check admin permissions.', fr: 'Impossible d’ajouter le produit. Vérifiez les droits administrateur.', de: 'Produkt konnte nicht hinzugefügt werden. Prüfe die Admin-Berechtigungen.' },
  'تمت إضافة المنتج بنجاح.': { en: 'Product added successfully.', fr: 'Produit ajouté avec succès.', de: 'Produkt erfolgreich hinzugefügt.' },
  'غير مسموح بتعديل الطلبات.': { en: 'You are not allowed to update orders.', fr: 'Vous n’êtes pas autorisé à modifier les commandes.', de: 'Du darfst Bestellungen nicht ändern.' },
  'حالة الطلب غير صحيحة.': { en: 'Invalid order status.', fr: 'Statut de commande invalide.', de: 'Ungültiger Bestellstatus.' },
  'تعذر تحديث حالة الطلب.': { en: 'Could not update order status.', fr: 'Impossible de mettre à jour le statut de la commande.', de: 'Bestellstatus konnte nicht aktualisiert werden.' },
  'تم تحديث حالة الطلب.': { en: 'Order status updated.', fr: 'Statut de commande mis à jour.', de: 'Bestellstatus aktualisiert.' },
  'تعذر تحميل بيانات المتجر. حاول تحديث الصفحة.': { en: 'Could not load store data. Try refreshing the page.', fr: 'Impossible de charger les données de la boutique. Actualisez la page.', de: 'Shopdaten konnten nicht geladen werden. Aktualisiere die Seite.' },
  'تعذر تسجيل الخروج. حاول مرة أخرى.': { en: 'Could not sign out. Please try again.', fr: 'Impossible de se déconnecter. Réessayez.', de: 'Abmelden fehlgeschlagen. Bitte versuche es erneut.' },
  'إرسال طلب التصميم': { en: 'Submit design request', fr: 'Envoyer la demande de design', de: 'Designanfrage senden' },
  'كمّل تسوّق': { en: 'Continue shopping', fr: 'Continuer les achats', de: 'Weiter einkaufen' },
  'YOUR IDEA / OUR STYLE': { en: 'YOUR IDEA / OUR STYLE', fr: 'VOTRE IDÉE / NOTRE STYLE', de: 'DEINE IDEE / UNSER STIL' },
  'Customize Design': { en: 'Customize Design', fr: 'Personnaliser le design', de: 'Design anpassen' },
  'جديدة': { en: 'New', fr: 'Nouvelle', de: 'Neu' },
  'قيد المراجعة': { en: 'In review', fr: 'En cours d’examen', de: 'In Bearbeitung' },
  'تم الحل': { en: 'Resolved', fr: 'Résolue', de: 'Gelöst' },
  'جديد': { en: 'New', fr: 'Nouvelle', de: 'Neu' },
  'تم التأكيد': { en: 'Confirmed', fr: 'Confirmée', de: 'Bestätigt' },
  'تم الشحن': { en: 'Shipped', fr: 'Expédiée', de: 'Versandt' },
  'تم التسليم': { en: 'Delivered', fr: 'Livrée', de: 'Zugestellt' },
  'ملغي': { en: 'Cancelled', fr: 'Annulée', de: 'Storniert' },
  'طلب': { en: 'Order', fr: 'Commande', de: 'Bestellung' },
  'رسالة': { en: 'Message', fr: 'Message', de: 'Nachricht' },
  'رقم الطلب: ': { en: 'Order reference: ', fr: 'Référence de commande : ', de: 'Bestellnummer: ' },
  'تأخير في التوصيل': { en: 'Delivery delay', fr: 'Retard de livraison', de: 'Lieferverzögerung' },
  'مشكلة في منتج': { en: 'Product issue', fr: 'Problème de produit', de: 'Produktproblem' },
  'استفسار': { en: 'Question', fr: 'Question', de: 'Frage' },
  'اقتراح': { en: 'Suggestion', fr: 'Suggestion', de: 'Vorschlag' },
  'نوع آخر': { en: 'Other', fr: 'Autre', de: 'Sonstiges' },
  'طلب منظم': { en: 'Organized ordering', fr: 'Commande organisée', de: 'Strukturierte Bestellung' },
  'بيانات الطلب بتتسجل بأمان': { en: 'Your order details are handled securely.', fr: 'Vos informations de commande sont traitées en sécurité.', de: 'Deine Bestelldaten werden sicher verarbeitet.' },
  'اختيارات واضحة': { en: 'Clear choices', fr: 'Choix clairs', de: 'Klare Auswahl' },
  'مقاسات وألوان لكل قطعة': { en: 'Sizes and colors for every item', fr: 'Tailles et couleurs pour chaque article', de: 'Größen und Farben für jedes Produkt' },
  'ستايل TRIPLE Z': { en: 'TRIPLE Z style', fr: 'Style TRIPLE Z', de: 'TRIPLE-Z-Stil' },
  'Streetwear بطابع خاص': { en: 'Streetwear with its own identity', fr: 'Streetwear avec une identité unique', de: 'Streetwear mit eigener Identität' },
  'جديدة': { en: 'New', fr: 'Nouvelle', de: 'Neu' },
  'قيد المراجعة': { en: 'In review', fr: 'En cours d’examen', de: 'In Bearbeitung' },
  'تم الحل': { en: 'Resolved', fr: 'Résolue', de: 'Gelöst' },
  'جديد': { en: 'New', fr: 'Nouveau', de: 'Neu' },
  'تم التأكيد': { en: 'Confirmed', fr: 'Confirmée', de: 'Bestätigt' },
  'تم الشحن': { en: 'Shipped', fr: 'Expédiée', de: 'Versandt' },
  'تم التسليم': { en: 'Delivered', fr: 'Livrée', de: 'Zugestellt' },
  'ملغي': { en: 'Cancelled', fr: 'Annulée', de: 'Storniert' },
  'تسجيل الخروج': { en: 'Sign out', fr: 'Déconnexion', de: 'Abmelden' },
  'تسجيل الدخول': { en: 'Sign in', fr: 'Se connecter', de: 'Anmelden' },
  'إرسال الرسالة': { en: 'Send message', fr: 'Envoyer le message', de: 'Nachricht senden' },
  'الاسم بالكامل': { en: 'Full name', fr: 'Nom complet', de: 'Vollständiger Name' },
  'رقم الموبايل': { en: 'Phone number', fr: 'Téléphone', de: 'Telefonnummer' },
  'رقم الطلب': { en: 'Order reference', fr: 'Référence de commande', de: 'Bestellnummer' },
  'اكتب اسمك': { en: 'Enter your name', fr: 'Entrez votre nom', de: 'Gib deinen Namen ein' },
  'تفاصيل الرسالة': { en: 'Message details', fr: 'Détails du message', de: 'Nachrichtendetails' },
  'اكتب رسالتك هنا...': { en: 'Write your message here...', fr: 'Écrivez votre message ici...', de: 'Schreibe deine Nachricht hier...' },
  'جارٍ الإرسال...': { en: 'Sending...', fr: 'Envoi...', de: 'Wird gesendet...' },
  'إتمام الطلب': { en: 'Checkout', fr: 'Commander', de: 'Zur Kasse' },
  'سلة المشتريات': { en: 'Shopping cart', fr: 'Panier', de: 'Warenkorb' },
  'الإجمالي': { en: 'Total', fr: 'Total', de: 'Gesamt' },
  'بيانات التوصيل': { en: 'Delivery details', fr: 'Informations de livraison', de: 'Lieferdaten' },
  'الدفع عند الاستلام — هنأكد الطلب قبل الشحن.': { en: 'Cash on delivery — we will confirm before shipping.', fr: 'Paiement à la livraison — nous confirmerons avant expédition.', de: 'Nachnahme – wir bestätigen die Bestellung vor dem Versand.' },
  'العنوان بالتفصيل والمحافظة': { en: 'Full address and governorate', fr: 'Adresse complète et gouvernorat', de: 'Vollständige Adresse und Gouvernement' },
  'تسوّق الآن': { en: 'Shop now', fr: 'Acheter', de: 'Jetzt einkaufen' },
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
  const [customerAuthError, setCustomerAuthError] = useState('');
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
      setCustomerAuthError(t('المتجر غير متصل بنظام الحسابات.'));
      return;
    }
    if (customerPassword.length < 6) {
      setCustomerAuthError(t('كلمة المرور لازم تكون 6 أحرف على الأقل.'));
      return;
    }

    setCustomerAuthLoading(true);
    setCustomerAuthError('');
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
          setCustomerAuthError('');
        } else {
          setCustomerAuthError(
            language === 'ar'
              ? 'تم إنشاء الحساب، لكن تسجيل الدخول لم يكتمل. راجع إعداد تأكيد البريد في Supabase أو جرّب تسجيل الدخول.'
              : language === 'fr'
                ? "Compte créé, mais la connexion n’a pas abouti. Vérifiez le paramètre de confirmation de l’e-mail dans Supabase."
                : language === 'de'
                  ? 'Konto erstellt, aber die Anmeldung war nicht erfolgreich. Prüfe die E-Mail-Bestätigung in Supabase.'
                  : 'Account created, but sign-in did not complete. Check the email confirmation setting in Supabase.'
          );
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
        setCustomerAuthError('');
        setNotice('تم تسجيل الدخول بنجاح.');
      }
    } catch (error) {
      console.error('Customer authentication error:', error);
      setCustomerAuthError(
        error.message === 'Email not confirmed'
          ? (language === 'ar' ? 'البريد الإلكتروني غير مؤكَّد. راجع إعدادات تأكيد البريد في Supabase.' : language === 'fr' ? 'E-mail non confirmé. Vérifiez les paramètres de confirmation dans Supabase.' : language === 'de' ? 'E-Mail nicht bestätigt. Prüfe die Bestätigungseinstellungen in Supabase.' : 'Email not confirmed. Check the confirmation settings in Supabase.')
          : error.message === 'Invalid login credentials'
            ? (language === 'ar' ? 'الإيميل أو كلمة المرور غير صحيحة.' : language === 'fr' ? 'Adresse e-mail ou mot de passe incorrect.' : language === 'de' ? 'E-Mail-Adresse oder Passwort ist falsch.' : 'Incorrect email or password.')
            : (error.message || (language === 'ar' ? 'تعذر تسجيل الدخول. راجع بياناتك وحاول مرة أخرى.' : language === 'fr' ? 'Connexion impossible. Vérifiez vos informations.' : language === 'de' ? 'Anmeldung fehlgeschlagen. Bitte überprüfe deine Angaben.' : 'Unable to sign in. Check your details and try again.'))
      );
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

      setNotice(language === 'ar'
        ? (emailSent
          ? `تم تسجيل طلبك بنجاح! الرقم المرجعي ${orderReference}، واتبعث إشعار Gmail.`
          : `تم تسجيل الطلب بنجاح! الرقم المرجعي ${orderReference}، لكن إشعار Gmail ماتبعتش.`)
        : language === 'fr'
          ? (emailSent
            ? `Commande enregistrée ! Référence ${orderReference}. Notification Gmail envoyée.`
            : `Commande enregistrée ! Référence ${orderReference}, mais la notification Gmail n’a pas été envoyée.`)
          : language === 'de'
            ? (emailSent
              ? `Bestellung erfolgreich gespeichert! Referenz ${orderReference}. Gmail-Benachrichtigung gesendet.`
              : `Bestellung gespeichert! Referenz ${orderReference}, aber die Gmail-Benachrichtigung wurde nicht gesendet.`)
            : (emailSent
              ? `Order saved successfully! Reference ${orderReference}. Gmail notification sent.`
              : `Order saved! Reference ${orderReference}, but the Gmail notification was not sent.`)
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
      return <p className="muted">{t('مفيش منتجات مطابقة للبحث حاليًا.')}</p>;
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
                <strong>{money(product.price, language)}</strong>
              </div>

              <div className="product-options">
                <label>
                  {t('المقاس')}
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
                  {t('اللون')}
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
                {Number(product.stock) <= 0 ? t('غير متوفر') : t('أضف للسلة')}
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
            <h2>{t('لوحة الإدارة')}</h2>
          </div>
          <button className="text-button" onClick={() => setAdminOpen(false)}>
            <X size={18} /> {t('إغلاق')}
          </button>
        </div>

        {authLoading ? (
          <p className="muted">{t('جارٍ التحقق من تسجيل الدخول...')}</p>
        ) : !session ? (
          <form className="admin-login" onSubmit={adminLogin}>
            <p>{t('سجّل دخولك بحساب المدير المصرّح له داخل Supabase.')}</p>
            <input
              type="email"
              placeholder={t('البريد الإلكتروني')}
              value={adminEmail}
              onChange={e => setAdminEmail(e.target.value)}
              autoComplete="username"
              required
            />
            <input
              type="password"
              placeholder={t('كلمة المرور')}
              value={adminPassword}
              onChange={e => setAdminPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button className="primary-button" type="submit">
              <LogIn size={17} /> {t('تسجيل الدخول')}
            </button>
          </form>
        ) : !isAdmin ? (
          <div className="admin-login">
            <p>{t('الحساب الحالي غير مخوّل لإدارة المتجر.')}</p>
            <button className="secondary-button" onClick={adminLogout}>
              <LogOut size={16} /> {t('تسجيل الخروج')}
            </button>
          </div>
        ) : (
          <div className="admin-content">
            <div className="admin-toolbar">
              <span><ShieldCheck size={18} /> {t('تم التحقق من دور المدير')}</span>
              <button className="text-button" onClick={adminLogout}>
                <LogOut size={16} /> {t('خروج')}
              </button>
            </div>

            <div className="admin-tabs">
              <button
                className={adminTab === 'orders' ? 'active' : ''}
                onClick={() => setAdminTab('orders')}
              >
                <Package size={16} /> {t('الطلبات')}
              </button>
              <button
                className={adminTab === 'complaints' ? 'active' : ''}
                onClick={() => setAdminTab('complaints')}
              >
                <MessageSquareWarning size={16} /> {t('الشكاوى')}
                <span>{adminComplaints.filter(c => c.status === 'new').length}</span>
              </button>
              <button
                className={adminTab === 'products' ? 'active' : ''}
                onClick={() => setAdminTab('products')}
              >
                <Plus size={16} /> {t('إضافة منتج')}
              </button>
            </div>

            {adminTab === 'products' && (
              <form className="admin-form admin-product-form" onSubmit={createProduct}>
                <h3><Plus size={18} /> {t('إضافة منتج')}</h3>
                <input
                  placeholder={t('اسم المنتج')}
                  value={newProduct.name}
                  onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                  required
                />
                <input
                  type="number" min="0.01" step="0.01"
                  placeholder={t('السعر بالجنيه')}
                  value={newProduct.price}
                  onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                  required
                />
                <input
                  type="url" placeholder={t('رابط الصورة')}
                  value={newProduct.image_url}
                  onChange={e => setNewProduct({ ...newProduct, image_url: e.target.value })}
                />
                <input
                  placeholder={t('الوصف')}
                  value={newProduct.description}
                  onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                />
                <input
                  placeholder={t('المقاسات مفصولة بفواصل')}
                  value={newProduct.sizes}
                  onChange={e => setNewProduct({ ...newProduct, sizes: e.target.value })}
                />
                <input
                  placeholder={t('الألوان مفصولة بفواصل')}
                  value={newProduct.colors}
                  onChange={e => setNewProduct({ ...newProduct, colors: e.target.value })}
                />
                <input
                  type="number" min="0" step="1" placeholder={t('المخزون')}
                  value={newProduct.stock}
                  onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })}
                />
                <button className="primary-button" type="submit">{t('حفظ المنتج')}</button>
              </form>
            )}

            {adminTab === 'orders' && (
              <div className="orders-box">
                <div className="admin-list-heading">
                  <h3><Package size={18} /> {t('الطلبات')}</h3>
                  <button className="secondary-button" onClick={loadOrders}>
                    <RefreshCw size={16} /> {t('تحديث')}
                  </button>
                </div>

                {adminOrders.map(order => (
                  <article className="order-card" key={order.id}>
                    <strong>{t('طلب')} #{order.id} — {money(order.total, language)}</strong>
                    <span>{order.customer_name} · {order.phone}</span>
                    <small>{order.address}</small>
                    <select
                      value={order.status}
                      onChange={e => updateOrderStatus(order.id, e.target.value)}
                    >
                      {allowedOrderStatuses.map(status =>
                        <option key={status} value={status}>{t(orderStatusLabels[status])}</option>
                      )}
                    </select>
                  </article>
                ))}

                {!adminOrders.length && (
                  <p className="muted">{t('لا توجد طلبات محملة. اضغط تحديث.')}</p>
                )}
              </div>
            )}

            {adminTab === 'complaints' && (
              <div className="orders-box">
                <div className="admin-list-heading">
                  <h3><MessageSquareWarning size={18} /> {t('الشكاوى والتواصل')}</h3>
                  <button className="secondary-button" onClick={loadComplaints}>
                    <RefreshCw size={16} /> {t('تحديث')}
                  </button>
                </div>

                {adminComplaints.map(complaint => (
                  <article className="order-card complaint-admin-card" key={complaint.id}>
                    <strong>{t('رسالة')} #{complaint.id} — {t(complaint.complaint_type)}</strong>
                    <span>{complaint.customer_name} · {complaint.phone}</span>
                    {complaint.order_reference && <small>{t('رقم الطلب')}: {complaint.order_reference}</small>}
                    <p className="complaint-message" style={{ whiteSpace: 'pre-wrap' }}>
                      {complaint.message}
                    </p>
                    <small>
                      {complaint.created_at
                        ? new Date(complaint.created_at).toLocaleString('ar-EG')
                        : ''}
                    </small>
                    <label className="status-field">
                      {t('حالة المتابعة')}
                      <select
                        value={complaint.status}
                        onChange={e => updateComplaintStatus(complaint.id, e.target.value)}
                      >
                        {complaintStatuses.map(status =>
                          <option key={status} value={status}>
                            {t(complaintStatusLabels[status])}
                          </option>
                        )}
                      </select>
                    </label>
                  </article>
                ))}

                {!adminComplaints.length && (
                  <p className="muted">{t('لا توجد شكاوى محملة. اضغط تحديث.')}</p>
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

        <nav className="page-nav" aria-label={t('الرئيسية')}>
          <a className={page === 'home' ? 'active' : ''} href="/"
            onClick={e => { e.preventDefault(); navigate('home'); }}>
            {t('الرئيسية')}
          </a>
          <a className={page === 'products' ? 'active' : ''} href="/products"
            onClick={e => { e.preventDefault(); navigate('products'); }}>
            {t('المنتجات')}
          </a>
          <a className={page === 'complaints' ? 'active' : ''} href="/complaints"
            onClick={e => { e.preventDefault(); navigate('complaints'); }}>
            {t('الشكاوى والتواصل')}
          </a>
        </nav>

        <div className="header-actions">
          <label className="language-switch" aria-label="Language">
            <Languages size={16} />
            <select value={language} onChange={e => setLanguage(e.target.value)} aria-label="Choose language">
              <option value="ar">العربية</option>
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </label>
          {session && !isAdmin ? (
            <button className="customer-account-button" onClick={customerLogout} title={session.user?.email || ''}>
              <LogOut size={16} /> {language === 'ar' ? 'تسجيل الخروج' : language === 'fr' ? 'Déconnexion' : language === 'de' ? 'Abmelden' : 'Sign out'}
            </button>
          ) : (
            <button className="customer-account-button" onClick={() => { setCustomerAuthError(''); setCustomerAuthMode('login'); setCustomerAuthOpen(true); }}>
              <UserRound size={16} /> {language === 'ar' ? 'حسابي' : language === 'fr' ? 'Mon compte' : language === 'de' ? 'Mein Konto' : 'My account'}
            </button>
          )}
          <button className="icon-button" aria-label={t('سلة المشتريات')} onClick={() => setDrawer(true)}>
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
          <span>{t(notice)}</span>
          <button onClick={() => setNotice('')} aria-label={t('إغلاق')}>
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
                <p className="hero-text">{t('ستايل شبابي. تفاصيل مختلفة. اختار القطعة اللي شبهك.')}</p>
                <div className="hero-actions">
                  <button className="primary-button" onClick={() => navigate('products')}>
                    {t('تسوّق الآن')} <ArrowUpRight size={18} />
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
              <p>TRIPLE Z — {t('هوية مستقلة، ستايل جريء، وتفاصيل معمولة عشان تفرق.')}</p>
              <button className="primary-button" onClick={() => navigate('products')}>
                {t('اكتشف المجموعة')} <ArrowUpRight size={18} />
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
              <h1>{t('المنتجات')}<span>.</span></h1>
              <p>{t('اختار القطعة والمقاس واللون المناسب ليك.')}</p>
            </div>

            <form className="product-search" onSubmit={e => e.preventDefault()}>
              <input
                type="search"
                placeholder={t("ابحث عن المنتجات...")}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                aria-label={t('البحث عن المنتجات')}
              />
              {searchTerm && (
                <button type="button" className="search-clear"
                  onClick={() => setSearchTerm('')} aria-label={t('مسح البحث')}>
                  <X size={16} />
                </button>
              )}
              <button className="search-submit" type="submit" aria-label={t('بحث')}>
                <Search size={20} />
                <span>{t("بحث")}</span>
              </button>
            </form>

            {!isSupabaseConfigured && (
              <div className="setup-warning">
                {t('دي معاينة تجريبية بمنتجات مؤقتة. قاعدة البيانات غير متصلة.')}
              </div>
            )}

            <div className="products-toolbar">
              <button className="secondary-button" onClick={() => setCustomOpen(true)}>
                <ImagePlus size={17} /> {t('اطلب تصميمك الخاص')}
              </button>
            </div>

            {renderProducts()}
          </section>
        )}

        {page === 'complaints' && (
          <section className="complaints-page">
            <div className="page-intro complaints-intro">
              <p className="eyebrow">CONTACT TRIPLE Z</p>
              <h1>{t('الشكاوى والتواصل')}<span>.</span></h1>
            </div>

            <form className="complaint-form" onSubmit={submitComplaint}>
              <h2>{t('ابعتلنا رسالة')}</h2>

              <label>
                {t('نوع الرسالة')}
                <select
                  value={complaintForm.complaint_type}
                  onChange={e => setComplaintForm({
                    ...complaintForm, complaint_type: e.target.value
                  })}
                >
                  <option>{t('شكوى بخصوص طلب')}</option>
                  <option>{t('تأخير في التوصيل')}</option>
                  <option>{t('مشكلة في منتج')}</option>
                  <option>{t('استفسار')}</option>
                  <option>{t('اقتراح')}</option>
                  <option>{t('نوع آخر')}</option>
                </select>
              </label>

              <label>
                {t('الاسم بالكامل')}
                <input
                  value={complaintForm.customer_name}
                  onChange={e => setComplaintForm({
                    ...complaintForm, customer_name: e.target.value
                  })}
                  placeholder={t('اكتب اسمك')}
                  minLength={2}
                  maxLength={100}
                  required
                />
              </label>

              <label>
                {t('رقم الموبايل')}
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
                {t('رقم الطلب')} <span className="optional-label">({language === 'ar' ? 'اختياري' : language === 'fr' ? 'facultatif' : language === 'de' ? 'optional' : 'optional'})</span>
                <input
                  value={complaintForm.order_reference}
                  onChange={e => setComplaintForm({
                    ...complaintForm, order_reference: e.target.value
                  })}
                  placeholder={t('مثال: TZ-123456')}
                  maxLength={100}
                />
              </label>

              <label>
                {t('تفاصيل الرسالة')}
                <textarea
                  value={complaintForm.message}
                  onChange={e => setComplaintForm({
                    ...complaintForm, message: e.target.value
                  })}
                  placeholder={t('اكتب رسالتك هنا...')}
                  minLength={5}
                  maxLength={3000}
                  rows={6}
                  required
                />
              </label>

              <button className="primary-button full-button" type="submit"
                disabled={complaintLoading}>
                {complaintLoading ? t('جارٍ الإرسال...') : t('إرسال الرسالة')}
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
          <a href="/" onClick={e => { e.preventDefault(); navigate('home'); }}>{t('الرئيسية')}</a>
          <a href="/products" onClick={e => { e.preventDefault(); navigate('products'); }}>{t('المنتجات')}</a>
          <a href="/complaints" onClick={e => { e.preventDefault(); navigate('complaints'); }}>{t('الشكاوى والتواصل')}</a>
        </div>
        <span>© 2026 TRIPLE Z. ALL RIGHTS RESERVED.</span>
      </footer>

      {customerAuthOpen && (
        <div className="drawer-backdrop auth-backdrop" onClick={() => { setCustomerAuthOpen(false); setCustomerAuthError(''); }}>
          <section className="customer-auth-modal" onClick={e => e.stopPropagation()}>
            <div className="drawer-heading">
              <div>
                <p className="eyebrow">TRIPLE Z ACCOUNT</p>
                <h2>{customerAuthMode === 'signup'
                  ? (language === 'ar' ? 'إنشاء حساب جديد' : language === 'fr' ? 'Créer un compte' : language === 'de' ? 'Neues Konto erstellen' : 'Create your account')
                  : (language === 'ar' ? 'تسجيل الدخول' : language === 'fr' ? 'Connexion' : language === 'de' ? 'Anmelden' : 'Sign in')}</h2>
              </div>
              <button className="icon-button" onClick={() => { setCustomerAuthOpen(false); setCustomerAuthError(''); }} aria-label={t('إغلاق')}>
                <X />
              </button>
            </div>
            <p className="muted">
              {language === 'ar'
                ? 'سجّل دخولك أو أنشئ حسابًا قبل تأكيد طلبك.'
                : language === 'fr'
                  ? 'Connectez-vous ou créez un compte avant de confirmer votre commande.'
                  : language === 'de'
                    ? 'Melde dich an oder erstelle ein Konto, bevor du die Bestellung bestätigst.'
                    : 'Sign in or create an account before confirming your order.'}
            </p>
            {customerAuthError && (
              <div className="auth-error" role="alert" aria-live="polite"
                style={{ margin: '12px 0', padding: '12px 14px', border: '1px solid #a33', borderRadius: '10px', color: 'inherit', background: 'rgba(180,35,35,.10)' }}>
                {customerAuthError}
              </div>
            )}
            <form className="customer-auth-form" onSubmit={submitCustomerAuth}>
              {customerAuthMode === 'signup' && (
                <label>
                  {language === 'ar' ? 'الاسم بالكامل' : language === 'fr' ? 'Nom complet' : language === 'de' ? 'Vollständiger Name' : 'Full name'}
                  <input value={customerName} onChange={e => setCustomerName(e.target.value)} minLength={2} required autoComplete="name" />
                </label>
              )}
              <label>
                {language === 'ar' ? 'البريد الإلكتروني' : language === 'fr' ? 'Adresse e-mail' : language === 'de' ? 'E-Mail-Adresse' : 'Email address'}
                <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} required autoComplete="email" />
              </label>
              <label>
                {language === 'ar' ? 'كلمة المرور (6 أحرف على الأقل)' : language === 'fr' ? 'Mot de passe (6 caractères minimum)' : language === 'de' ? 'Passwort (mindestens 6 Zeichen)' : 'Password (at least 6 characters)'}
                <input type="password" value={customerPassword} onChange={e => setCustomerPassword(e.target.value)} minLength={6} required autoComplete={customerAuthMode === 'signup' ? 'new-password' : 'current-password'} />
              </label>
              <button className="primary-button full-button" type="submit" disabled={customerAuthLoading}>
                {customerAuthLoading
                  ? (language === 'ar' ? 'جارٍ المعالجة...' : language === 'fr' ? 'Traitement...' : language === 'de' ? 'Bitte warten...' : 'Please wait...')
                  : customerAuthMode === 'signup'
                    ? (language === 'ar' ? 'إنشاء حساب' : language === 'fr' ? 'Créer un compte' : language === 'de' ? 'Konto erstellen' : 'Create account')
                    : (language === 'ar' ? 'تسجيل الدخول' : language === 'fr' ? 'Se connecter' : language === 'de' ? 'Anmelden' : 'Sign in')}
              </button>
            </form>
            <button className="auth-mode-toggle" type="button" onClick={() => { setCustomerAuthError(''); setCustomerAuthMode(mode => mode === 'login' ? 'signup' : 'login'); }}>
              {customerAuthMode === 'login'
                ? (language === 'ar' ? 'ليس لديك حساب؟ إنشاء حساب' : language === 'fr' ? 'Pas de compte ? Créer un compte' : language === 'de' ? 'Noch kein Konto? Konto erstellen' : "Don't have an account? Create one")
                : (language === 'ar' ? 'لديك حساب بالفعل؟ تسجيل الدخول' : language === 'fr' ? 'Déjà un compte ? Se connecter' : language === 'de' ? 'Du hast schon ein Konto? Anmelden' : 'Already have an account? Sign in')}
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
                <h2>{t('Customize Design')}</h2>
              </div>
              <button className="icon-button" onClick={() => setCustomOpen(false)}
                aria-label="إغلاق">
                <X />
              </button>
            </div>

            <p className="muted">
              {t('ارفع صورة التصميم اللي في بالك واكتب تفاصيله، وفريق TRIPLE Z هيراجع طلبك.')}
            </p>

            <form className="custom-form" onSubmit={submitCustomDesign}>
              <label>
                {t('الاسم بالكامل')}
                <input value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder={t('اكتب اسمك')} minLength={2} required />
              </label>

              <label>
                {t('رقم الموبايل')}
                <input type="tel" value={customPhone}
                  onChange={e => setCustomPhone(e.target.value)}
                  placeholder="01xxxxxxxxx" minLength={8} required />
              </label>

              <label className="custom-upload">
                <ImagePlus size={24} />
                <strong>{customFile ? customFile.name : t('اختار صورة التصميم')}</strong>
                <span>{t('PNG أو JPG — بحد أقصى 5 ميجابايت')}</span>
                <input type="file" accept="image/*"
                  onChange={e => setCustomFile(e.target.files?.[0] || null)}
                  required />
              </label>

              {customFile && (
                <div className="selected-file">
                  <span>{customFile.name}</span>
                  <button type="button" onClick={() => setCustomFile(null)}
                    aria-label={t('إزالة الصورة')}>
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              <label>
                {t('تفاصيل التصميم')}
                <textarea value={customDescription}
                  onChange={e => setCustomDescription(e.target.value)}
                  placeholder={t('مثلاً: لون الهودي، مكان التصميم، المقاس...')}
                  maxLength={1500} rows={4} />
              </label>

              <button className="primary-button full-button" type="submit"
                disabled={customLoading}>
                {customLoading ? t('جارٍ إرسال طلبك...') : t('إرسال طلب التصميم')}
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
                aria-label={t('إغلاق السلة')}>
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
                  {t('كمّل تسوّق')}
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
                        <b>{money(item.price * item.quantity, language)}</b>
                        <div className="qty-controls">
                          <button onClick={() => changeQty(item.key, -1)} aria-label={t('تقليل الكمية')}>
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
                          }} aria-label={t('زيادة الكمية')}>
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="cart-total">
                  <span>{t('الإجمالي')}</span>
                  <strong>{money(total, language)}</strong>
                </div>

                {!checkout ? (
                  <button className="primary-button full-button" onClick={() => {
                    setCheckout(true);
                    if (!session || isAdmin) {
                      setCustomerAuthError('');
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
                    <textarea placeholder={t("العنوان بالتفصيل والمحافظة")} value={form.address}
                      onChange={e => setForm({ ...form, address: e.target.value })}
                      required minLength={8} />
                    <p className="muted">{t("الدفع عند الاستلام — هنأكد الطلب قبل الشحن.")}</p>
                    <button className="primary-button full-button" type="submit" disabled={loading}>
                       {loading ? (language === 'ar' ? 'جارٍ تسجيل الطلب...' : language === 'fr' ? 'Enregistrement...' : language === 'de' ? 'Bestellung wird gespeichert...' : 'Saving order...') : `${language === 'ar' ? 'تأكيد الطلب' : language === 'fr' ? 'Confirmer la commande' : language === 'de' ? 'Bestellung bestätigen' : 'Confirm order'} — ${money(total, language)}`}
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
