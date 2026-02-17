import { createContext, useContext, useState, ReactNode } from 'react';

export type SupportedLanguage = 'en' | 'fr' | 'ru' | 'zh' | 'es' | 'de' | 'nl' | 'id' | 'ko';

// Currency types and configuration
export type SupportedCurrency = 'IDR' | 'EUR' | 'GBP' | 'USD' | 'RUB' | 'CNY' | 'KRW';

export interface CurrencyConfig {
  code: SupportedCurrency;
  symbol: string;
  label: string;
  flag: string;
  rateFromIDR: number; // How many units of this currency per 1 IDR
}

// Exchange rates (approximate, base: IDR)
export const CURRENCY_CONFIG: CurrencyConfig[] = [
  { code: 'IDR', symbol: 'Rp', label: 'Indonesian Rupiah', flag: '🇮🇩', rateFromIDR: 1 },
  { code: 'EUR', symbol: '€', label: 'Euro', flag: '🇪🇺', rateFromIDR: 0.000058 },
  { code: 'GBP', symbol: '£', label: 'British Pound', flag: '🇬🇧', rateFromIDR: 0.000049 },
  { code: 'USD', symbol: '$', label: 'US Dollar', flag: '🇺🇸', rateFromIDR: 0.000062 },
  { code: 'RUB', symbol: '₽', label: 'Russian Ruble', flag: '🇷🇺', rateFromIDR: 0.0056 },
  { code: 'CNY', symbol: '¥', label: 'Chinese Yuan', flag: '🇨🇳', rateFromIDR: 0.00045 },
  { code: 'KRW', symbol: '₩', label: 'Korean Won', flag: '🇰🇷', rateFromIDR: 0.085 },
];

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const translations: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    // General
    'select': 'Select',
    'back': 'Back',
    'next': 'Next',
    'confirm': 'Confirm',
    'apply': 'Apply',
    'delete': 'Delete',
    'included': 'Included',
    'loading': 'Loading...',
    'noResults': 'No results found',
    
    // Service type
    'serviceType': 'Service Type',
    'sharedBoat': 'Shared Boat',
    'privateBoat': 'Private Boat',
    'sharedBoatDesc': 'Travel with other passengers at fixed schedules',
    'privateBoatDesc': 'Exclusive boat charter for your group',
    
    // Route selection
    'selectRoute': 'Select Route',
    'from': 'From',
    'to': 'To',
    'selectOrigin': 'Select origin',
    'selectDestination': 'Select destination',
    'tripType': 'Trip Type',
    'oneWay': 'One Way',
    'roundTrip': 'Round Trip',
    'departureDate': 'Departure Date',
    'returnDate': 'Return Date',
    'searchTrips': 'Search Trips',
    
    // Passengers
    'passengers': 'Passengers',
    'adult': 'Adult',
    'adults': 'Adults',
    'child': 'Child',
    'children': 'Children',
    'infant': 'Infant',
    'infants': 'Infants',
    'yearsOld': 'years old',
    'underYears': 'under {years} years',
    'adultAge': 'Adult (12y+)',
    'childAge': 'Child (2-12y)',
    'infantAge': 'Infant (0-2y)',
    
    // Departures
    'selectDeparture': 'Select Departure',
    'availableTrips': 'Available Trips',
    'noTripsAvailable': 'No trips available for this date',
    'seatsAvailable': 'seats available',
    'departure': 'Departure',
    'arrival': 'Arrival',
    'duration': 'Duration',
    'minutes': 'min',
    
    // Addons
    'addons': 'Add-ons',
    'optionalAddons': 'Optional Add-ons',
    'selectAddons': 'Select Add-ons',
    
    // Pickup/Dropoff
    'pickup': 'Pickup',
    'dropoff': 'Dropoff',
    'pickupOptions': 'Pickup options',
    'dropoffOptions': 'Dropoff options',
    'pickupArea': 'Pickup area',
    'dropoffArea': 'Dropoff area',
    'selectPickup': 'Select pickup',
    'selectDropoff': 'Select dropoff',
    'hotelAddress': 'Hotel / Address',
    'enterHotelAddress': 'Enter your hotel or address',
    'privatePickup': 'Private pickup',
    'privateDropoff': 'Private dropoff',
    'numberOfPassengers': 'Number of passengers',
    'car': 'PRIVATE Car',
    'minibus': 'PRIVATE Minibus',
    'maxPax': 'max {count} pax',
    'forOneWay': 'for one way',
    'minBefore': '{minutes} min before',
    'noPickupAvailable': 'No pickup services available for this departure port.',
    'noDropoffAvailable': 'No dropoff services available for this arrival port.',
    
    // Shopping cart
    'yourTrips': 'Your Trips',
    'tickets': 'Tickets',
    'selectTripToSeeSummary': 'Select a trip to see summary',
    'grandTotal': 'Grand Total',
    'promoCode': 'Promo Code',
    'enterPromoCode': 'Enter promo code',
    'bookOtherTrip': 'Book other trip',
    'proceedToCheckout': 'Proceed to Checkout',
    'boatInfo': 'Boat Info',
    
    // Checkout
    'checkout': 'Checkout',
    'contactDetails': 'Contact Details',
    'fullName': 'Full Name',
    'email': 'Email',
    'phone': 'Phone',
    'country': 'Country',
    'specialRequests': 'Special Requests',
    'termsAndConditions': 'Terms and Conditions',
    'iAgreeToTerms': 'I agree to the terms and conditions',
    'payNow': 'Pay Now',
    'payLater': 'Pay Later',
    'bookNow': 'Book Now',
    
    // Booking success
    'bookingConfirmed': 'Booking Confirmed!',
    'bookingReference': 'Booking Reference',
    'thankYou': 'Thank you for your booking',
    'confirmationSent': 'A confirmation email has been sent to your email address.',
    'downloadTicket': 'Download Ticket',
    'bookAnother': 'Book Another Trip',
    
    // Private boat
    'selectBoat': 'Select Boat',
    'boatDetails': 'Boat Details',
    'capacity': 'Capacity',
    'description': 'Description',
    'selectDate': 'Select Date',
    'selectTime': 'Select Time',
    
    // Errors
    'errorOccurred': 'An error occurred',
    'tryAgain': 'Try Again',
    'required': 'Required',
    'invalidEmail': 'Invalid email address',
    'invalidPhone': 'Invalid phone number',
  },
  
  fr: {
    // General
    'select': 'Sélectionner',
    'back': 'Retour',
    'next': 'Suivant',
    'confirm': 'Confirmer',
    'apply': 'Appliquer',
    'delete': 'Supprimer',
    'included': 'Inclus',
    'loading': 'Chargement...',
    'noResults': 'Aucun résultat trouvé',
    
    // Service type
    'serviceType': 'Type de service',
    'sharedBoat': 'Bateau partagé',
    'privateBoat': 'Bateau privé',
    'sharedBoatDesc': 'Voyagez avec d\'autres passagers aux horaires fixes',
    'privateBoatDesc': 'Location exclusive du bateau pour votre groupe',
    
    // Route selection
    'selectRoute': 'Sélectionner l\'itinéraire',
    'from': 'De',
    'to': 'À',
    'selectOrigin': 'Sélectionner l\'origine',
    'selectDestination': 'Sélectionner la destination',
    'tripType': 'Type de voyage',
    'oneWay': 'Aller simple',
    'roundTrip': 'Aller-retour',
    'departureDate': 'Date de départ',
    'returnDate': 'Date de retour',
    'searchTrips': 'Rechercher des trajets',
    
    // Passengers
    'passengers': 'Passagers',
    'adult': 'Adulte',
    'adults': 'Adultes',
    'child': 'Enfant',
    'children': 'Enfants',
    'infant': 'Bébé',
    'infants': 'Bébés',
    'yearsOld': 'ans',
    'underYears': 'moins de {years} ans',
    'adultAge': 'Adulte (12 ans+)',
    'childAge': 'Enfant (2-12 ans)',
    'infantAge': 'Bébé (0-2 ans)',
    
    // Departures
    'selectDeparture': 'Sélectionner le départ',
    'availableTrips': 'Trajets disponibles',
    'noTripsAvailable': 'Aucun trajet disponible pour cette date',
    'seatsAvailable': 'places disponibles',
    'departure': 'Départ',
    'arrival': 'Arrivée',
    'duration': 'Durée',
    'minutes': 'min',
    
    // Addons
    'addons': 'Options',
    'optionalAddons': 'Options facultatives',
    'selectAddons': 'Sélectionner les options',
    
    // Pickup/Dropoff
    'pickup': 'Prise en charge',
    'dropoff': 'Dépose',
    'pickupOptions': 'Options de prise en charge',
    'dropoffOptions': 'Options de dépose',
    'pickupArea': 'Zone de prise en charge',
    'dropoffArea': 'Zone de dépose',
    'selectPickup': 'Sélectionner la prise en charge',
    'selectDropoff': 'Sélectionner la dépose',
    'hotelAddress': 'Hôtel / Adresse',
    'enterHotelAddress': 'Entrez votre hôtel ou adresse',
    'privatePickup': 'Transport privé',
    'privateDropoff': 'Dépose privée',
    'numberOfPassengers': 'Nombre de passagers',
    'car': 'Voiture PRIVÉE',
    'minibus': 'Minibus PRIVÉ',
    'maxPax': 'max {count} pers.',
    'forOneWay': 'aller simple',
    'minBefore': '{minutes} min avant',
    'noPickupAvailable': 'Aucun service de prise en charge disponible pour ce port.',
    'noDropoffAvailable': 'Aucun service de dépose disponible pour ce port.',
    
    // Shopping cart
    'yourTrips': 'Vos trajets',
    'tickets': 'Billets',
    'selectTripToSeeSummary': 'Sélectionnez un trajet pour voir le résumé',
    'grandTotal': 'Total',
    'promoCode': 'Code promo',
    'enterPromoCode': 'Entrez le code promo',
    'bookOtherTrip': 'Réserver un autre trajet',
    'proceedToCheckout': 'Passer à la caisse',
    'boatInfo': 'Info bateau',
    
    // Checkout
    'checkout': 'Paiement',
    'contactDetails': 'Coordonnées',
    'fullName': 'Nom complet',
    'email': 'Email',
    'phone': 'Téléphone',
    'country': 'Pays',
    'specialRequests': 'Demandes spéciales',
    'termsAndConditions': 'Conditions générales',
    'iAgreeToTerms': 'J\'accepte les conditions générales',
    'payNow': 'Payer maintenant',
    'payLater': 'Payer plus tard',
    'bookNow': 'Réserver maintenant',
    
    // Booking success
    'bookingConfirmed': 'Réservation confirmée !',
    'bookingReference': 'Référence de réservation',
    'thankYou': 'Merci pour votre réservation',
    'confirmationSent': 'Un email de confirmation a été envoyé à votre adresse.',
    'downloadTicket': 'Télécharger le billet',
    'bookAnother': 'Réserver un autre trajet',
    
    // Private boat
    'selectBoat': 'Sélectionner le bateau',
    'boatDetails': 'Détails du bateau',
    'capacity': 'Capacité',
    'description': 'Description',
    'selectDate': 'Sélectionner la date',
    'selectTime': 'Sélectionner l\'heure',
    
    // Errors
    'errorOccurred': 'Une erreur s\'est produite',
    'tryAgain': 'Réessayer',
    'required': 'Obligatoire',
    'invalidEmail': 'Adresse email invalide',
    'invalidPhone': 'Numéro de téléphone invalide',
  },
  
  ru: {
    // General
    'select': 'Выбрать',
    'back': 'Назад',
    'next': 'Далее',
    'confirm': 'Подтвердить',
    'apply': 'Применить',
    'delete': 'Удалить',
    'included': 'Включено',
    'loading': 'Загрузка...',
    'noResults': 'Результаты не найдены',
    
    // Service type
    'serviceType': 'Тип услуги',
    'sharedBoat': 'Общая лодка',
    'privateBoat': 'Частная лодка',
    'sharedBoatDesc': 'Путешествуйте с другими пассажирами по расписанию',
    'privateBoatDesc': 'Эксклюзивная аренда лодки для вашей группы',
    
    // Route selection
    'selectRoute': 'Выбрать маршрут',
    'from': 'Откуда',
    'to': 'Куда',
    'selectOrigin': 'Выбрать пункт отправления',
    'selectDestination': 'Выбрать пункт назначения',
    'tripType': 'Тип поездки',
    'oneWay': 'В одну сторону',
    'roundTrip': 'Туда и обратно',
    'departureDate': 'Дата отправления',
    'returnDate': 'Дата возвращения',
    'searchTrips': 'Искать рейсы',
    
    // Passengers
    'passengers': 'Пассажиры',
    'adult': 'Взрослый',
    'adults': 'Взрослые',
    'child': 'Ребенок',
    'children': 'Дети',
    'infant': 'Младенец',
    'infants': 'Младенцы',
    'yearsOld': 'лет',
    'underYears': 'до {years} лет',
    'adultAge': 'Взрослый (12+)',
    'childAge': 'Ребенок (2-12)',
    'infantAge': 'Младенец (0-2)',
    
    // Departures
    'selectDeparture': 'Выбрать отправление',
    'availableTrips': 'Доступные рейсы',
    'noTripsAvailable': 'Нет рейсов на эту дату',
    'seatsAvailable': 'мест доступно',
    'departure': 'Отправление',
    'arrival': 'Прибытие',
    'duration': 'Длительность',
    'minutes': 'мин',
    
    // Addons
    'addons': 'Дополнения',
    'optionalAddons': 'Дополнительные опции',
    'selectAddons': 'Выбрать дополнения',
    
    // Pickup/Dropoff
    'pickup': 'Трансфер',
    'dropoff': 'Высадка',
    'pickupOptions': 'Опции трансфера',
    'dropoffOptions': 'Опции высадки',
    'pickupArea': 'Зона посадки',
    'dropoffArea': 'Зона высадки',
    'selectPickup': 'Выбрать трансфер',
    'selectDropoff': 'Выбрать высадку',
    'hotelAddress': 'Отель / Адрес',
    'enterHotelAddress': 'Введите название отеля или адрес',
    'privatePickup': 'Частный трансфер',
    'privateDropoff': 'Частная высадка',
    'numberOfPassengers': 'Количество пассажиров',
    'car': 'ЧАСТНЫЙ автомобиль',
    'minibus': 'ЧАСТНЫЙ микроавтобус',
    'maxPax': 'макс. {count} чел.',
    'forOneWay': 'в одну сторону',
    'minBefore': '{minutes} мин до',
    'noPickupAvailable': 'Трансфер недоступен для этого порта.',
    'noDropoffAvailable': 'Высадка недоступна для этого порта.',
    
    // Shopping cart
    'yourTrips': 'Ваши поездки',
    'tickets': 'Билеты',
    'selectTripToSeeSummary': 'Выберите рейс для просмотра итога',
    'grandTotal': 'Итого',
    'promoCode': 'Промокод',
    'enterPromoCode': 'Введите промокод',
    'bookOtherTrip': 'Забронировать другой рейс',
    'proceedToCheckout': 'Перейти к оплате',
    'boatInfo': 'О лодке',
    
    // Checkout
    'checkout': 'Оформление',
    'contactDetails': 'Контактные данные',
    'fullName': 'Полное имя',
    'email': 'Email',
    'phone': 'Телефон',
    'country': 'Страна',
    'specialRequests': 'Особые пожелания',
    'termsAndConditions': 'Условия и положения',
    'iAgreeToTerms': 'Я согласен с условиями',
    'payNow': 'Оплатить сейчас',
    'payLater': 'Оплатить позже',
    'bookNow': 'Забронировать',
    
    // Booking success
    'bookingConfirmed': 'Бронирование подтверждено!',
    'bookingReference': 'Номер бронирования',
    'thankYou': 'Спасибо за вашу бронь',
    'confirmationSent': 'Письмо с подтверждением отправлено на вашу почту.',
    'downloadTicket': 'Скачать билет',
    'bookAnother': 'Забронировать другой рейс',
    
    // Private boat
    'selectBoat': 'Выбрать лодку',
    'boatDetails': 'Детали лодки',
    'capacity': 'Вместимость',
    'description': 'Описание',
    'selectDate': 'Выбрать дату',
    'selectTime': 'Выбрать время',
    
    // Errors
    'errorOccurred': 'Произошла ошибка',
    'tryAgain': 'Попробовать снова',
    'required': 'Обязательно',
    'invalidEmail': 'Неверный email',
    'invalidPhone': 'Неверный номер телефона',
  },
  
  zh: {
    // General
    'select': '选择',
    'back': '返回',
    'next': '下一步',
    'confirm': '确认',
    'apply': '应用',
    'delete': '删除',
    'included': '已包含',
    'loading': '加载中...',
    'noResults': '未找到结果',
    
    // Service type
    'serviceType': '服务类型',
    'sharedBoat': '拼船',
    'privateBoat': '包船',
    'sharedBoatDesc': '与其他乘客按固定时间表出行',
    'privateBoatDesc': '专属包船服务',
    
    // Route selection
    'selectRoute': '选择航线',
    'from': '出发地',
    'to': '目的地',
    'selectOrigin': '选择出发地',
    'selectDestination': '选择目的地',
    'tripType': '行程类型',
    'oneWay': '单程',
    'roundTrip': '往返',
    'departureDate': '出发日期',
    'returnDate': '返回日期',
    'searchTrips': '搜索航班',
    
    // Passengers
    'passengers': '乘客',
    'adult': '成人',
    'adults': '成人',
    'child': '儿童',
    'children': '儿童',
    'infant': '婴儿',
    'infants': '婴儿',
    'yearsOld': '岁',
    'underYears': '{years}岁以下',
    'adultAge': '成人 (12岁+)',
    'childAge': '儿童 (2-12岁)',
    'infantAge': '婴儿 (0-2岁)',
    
    // Departures
    'selectDeparture': '选择航班',
    'availableTrips': '可用航班',
    'noTripsAvailable': '该日期无可用航班',
    'seatsAvailable': '个座位可用',
    'departure': '出发',
    'arrival': '到达',
    'duration': '时长',
    'minutes': '分钟',
    
    // Addons
    'addons': '附加服务',
    'optionalAddons': '可选附加服务',
    'selectAddons': '选择附加服务',
    
    // Pickup/Dropoff
    'pickup': '接送',
    'dropoff': '送达',
    'pickupOptions': '接送选项',
    'dropoffOptions': '送达选项',
    'pickupArea': '接送区域',
    'dropoffArea': '送达区域',
    'selectPickup': '选择接送地点',
    'selectDropoff': '选择送达地点',
    'hotelAddress': '酒店/地址',
    'enterHotelAddress': '输入酒店或地址',
    'privatePickup': '私人接送',
    'privateDropoff': '私人送达',
    'numberOfPassengers': '乘客人数',
    'car': '私人轿车',
    'minibus': '私人小巴',
    'maxPax': '最多{count}人',
    'forOneWay': '单程',
    'minBefore': '提前{minutes}分钟',
    'noPickupAvailable': '该港口无接送服务。',
    'noDropoffAvailable': '该港口无送达服务。',
    
    // Shopping cart
    'yourTrips': '您的行程',
    'tickets': '船票',
    'selectTripToSeeSummary': '选择行程查看详情',
    'grandTotal': '总计',
    'promoCode': '优惠码',
    'enterPromoCode': '输入优惠码',
    'bookOtherTrip': '预订其他行程',
    'proceedToCheckout': '去结账',
    'boatInfo': '船只信息',
    
    // Checkout
    'checkout': '结账',
    'contactDetails': '联系方式',
    'fullName': '姓名',
    'email': '邮箱',
    'phone': '电话',
    'country': '国家',
    'specialRequests': '特殊要求',
    'termsAndConditions': '条款和条件',
    'iAgreeToTerms': '我同意条款和条件',
    'payNow': '立即支付',
    'payLater': '稍后支付',
    'bookNow': '立即预订',
    
    // Booking success
    'bookingConfirmed': '预订成功！',
    'bookingReference': '预订号',
    'thankYou': '感谢您的预订',
    'confirmationSent': '确认邮件已发送至您的邮箱。',
    'downloadTicket': '下载船票',
    'bookAnother': '预订其他行程',
    
    // Private boat
    'selectBoat': '选择船只',
    'boatDetails': '船只详情',
    'capacity': '载客量',
    'description': '描述',
    'selectDate': '选择日期',
    'selectTime': '选择时间',
    
    // Errors
    'errorOccurred': '发生错误',
    'tryAgain': '重试',
    'required': '必填',
    'invalidEmail': '邮箱格式错误',
    'invalidPhone': '电话格式错误',
  },
  
  es: {
    // General
    'select': 'Seleccionar',
    'back': 'Volver',
    'next': 'Siguiente',
    'confirm': 'Confirmar',
    'apply': 'Aplicar',
    'delete': 'Eliminar',
    'included': 'Incluido',
    'loading': 'Cargando...',
    'noResults': 'No se encontraron resultados',
    
    // Service type
    'serviceType': 'Tipo de servicio',
    'sharedBoat': 'Barco compartido',
    'privateBoat': 'Barco privado',
    'sharedBoatDesc': 'Viaja con otros pasajeros en horarios fijos',
    'privateBoatDesc': 'Alquiler exclusivo del barco para tu grupo',
    
    // Route selection
    'selectRoute': 'Seleccionar ruta',
    'from': 'Desde',
    'to': 'Hasta',
    'selectOrigin': 'Seleccionar origen',
    'selectDestination': 'Seleccionar destino',
    'tripType': 'Tipo de viaje',
    'oneWay': 'Solo ida',
    'roundTrip': 'Ida y vuelta',
    'departureDate': 'Fecha de salida',
    'returnDate': 'Fecha de regreso',
    'searchTrips': 'Buscar viajes',
    
    // Passengers
    'passengers': 'Pasajeros',
    'adult': 'Adulto',
    'adults': 'Adultos',
    'child': 'Niño',
    'children': 'Niños',
    'infant': 'Bebé',
    'infants': 'Bebés',
    'yearsOld': 'años',
    'underYears': 'menores de {years} años',
    'adultAge': 'Adulto (12+)',
    'childAge': 'Niño (2-12)',
    'infantAge': 'Bebé (0-2)',
    
    // Departures
    'selectDeparture': 'Seleccionar salida',
    'availableTrips': 'Viajes disponibles',
    'noTripsAvailable': 'No hay viajes disponibles para esta fecha',
    'seatsAvailable': 'asientos disponibles',
    'departure': 'Salida',
    'arrival': 'Llegada',
    'duration': 'Duración',
    'minutes': 'min',
    
    // Addons
    'addons': 'Extras',
    'optionalAddons': 'Extras opcionales',
    'selectAddons': 'Seleccionar extras',
    
    // Pickup/Dropoff
    'pickup': 'Recogida',
    'dropoff': 'Entrega',
    'pickupOptions': 'Opciones de recogida',
    'dropoffOptions': 'Opciones de entrega',
    'pickupArea': 'Zona de recogida',
    'dropoffArea': 'Zona de entrega',
    'selectPickup': 'Seleccionar recogida',
    'selectDropoff': 'Seleccionar entrega',
    'hotelAddress': 'Hotel / Dirección',
    'enterHotelAddress': 'Ingresa tu hotel o dirección',
    'privatePickup': 'Transporte privado',
    'privateDropoff': 'Entrega privada',
    'numberOfPassengers': 'Número de pasajeros',
    'car': 'Coche PRIVADO',
    'minibus': 'Minibús PRIVADO',
    'maxPax': 'máx. {count} pers.',
    'forOneWay': 'solo ida',
    'minBefore': '{minutes} min antes',
    'noPickupAvailable': 'No hay servicio de recogida disponible para este puerto.',
    'noDropoffAvailable': 'No hay servicio de entrega disponible para este puerto.',
    
    // Shopping cart
    'yourTrips': 'Tus viajes',
    'tickets': 'Billetes',
    'selectTripToSeeSummary': 'Selecciona un viaje para ver el resumen',
    'grandTotal': 'Total',
    'promoCode': 'Código promocional',
    'enterPromoCode': 'Ingresa el código promocional',
    'bookOtherTrip': 'Reservar otro viaje',
    'proceedToCheckout': 'Ir al pago',
    'boatInfo': 'Info del barco',
    
    // Checkout
    'checkout': 'Pago',
    'contactDetails': 'Datos de contacto',
    'fullName': 'Nombre completo',
    'email': 'Email',
    'phone': 'Teléfono',
    'country': 'País',
    'specialRequests': 'Solicitudes especiales',
    'termsAndConditions': 'Términos y condiciones',
    'iAgreeToTerms': 'Acepto los términos y condiciones',
    'payNow': 'Pagar ahora',
    'payLater': 'Pagar después',
    'bookNow': 'Reservar ahora',
    
    // Booking success
    'bookingConfirmed': '¡Reserva confirmada!',
    'bookingReference': 'Referencia de reserva',
    'thankYou': 'Gracias por tu reserva',
    'confirmationSent': 'Se ha enviado un email de confirmación a tu dirección.',
    'downloadTicket': 'Descargar billete',
    'bookAnother': 'Reservar otro viaje',
    
    // Private boat
    'selectBoat': 'Seleccionar barco',
    'boatDetails': 'Detalles del barco',
    'capacity': 'Capacidad',
    'description': 'Descripción',
    'selectDate': 'Seleccionar fecha',
    'selectTime': 'Seleccionar hora',
    
    // Errors
    'errorOccurred': 'Ha ocurrido un error',
    'tryAgain': 'Intentar de nuevo',
    'required': 'Obligatorio',
    'invalidEmail': 'Email inválido',
    'invalidPhone': 'Teléfono inválido',
  },
  
  de: {
    // General
    'select': 'Auswählen',
    'back': 'Zurück',
    'next': 'Weiter',
    'confirm': 'Bestätigen',
    'apply': 'Anwenden',
    'delete': 'Löschen',
    'included': 'Inklusive',
    'loading': 'Laden...',
    'noResults': 'Keine Ergebnisse gefunden',
    
    // Service type
    'serviceType': 'Serviceart',
    'sharedBoat': 'Gemeinschaftsboot',
    'privateBoat': 'Privatboot',
    'sharedBoatDesc': 'Reisen Sie mit anderen Passagieren nach Fahrplan',
    'privateBoatDesc': 'Exklusive Bootscharter für Ihre Gruppe',
    
    // Route selection
    'selectRoute': 'Route auswählen',
    'from': 'Von',
    'to': 'Nach',
    'selectOrigin': 'Abfahrtsort auswählen',
    'selectDestination': 'Zielort auswählen',
    'tripType': 'Reiseart',
    'oneWay': 'Einfache Fahrt',
    'roundTrip': 'Hin und zurück',
    'departureDate': 'Abfahrtsdatum',
    'returnDate': 'Rückfahrtsdatum',
    'searchTrips': 'Fahrten suchen',
    
    // Passengers
    'passengers': 'Passagiere',
    'adult': 'Erwachsener',
    'adults': 'Erwachsene',
    'child': 'Kind',
    'children': 'Kinder',
    'infant': 'Kleinkind',
    'infants': 'Kleinkinder',
    'yearsOld': 'Jahre alt',
    'underYears': 'unter {years} Jahren',
    'adultAge': 'Erwachsener (12+)',
    'childAge': 'Kind (2-12)',
    'infantAge': 'Kleinkind (0-2)',
    
    // Departures
    'selectDeparture': 'Abfahrt auswählen',
    'availableTrips': 'Verfügbare Fahrten',
    'noTripsAvailable': 'Keine Fahrten für dieses Datum verfügbar',
    'seatsAvailable': 'Plätze verfügbar',
    'departure': 'Abfahrt',
    'arrival': 'Ankunft',
    'duration': 'Dauer',
    'minutes': 'Min',
    
    // Addons
    'addons': 'Extras',
    'optionalAddons': 'Optionale Extras',
    'selectAddons': 'Extras auswählen',
    
    // Pickup/Dropoff
    'pickup': 'Abholung',
    'dropoff': 'Abgabe',
    'pickupOptions': 'Abholoptionen',
    'dropoffOptions': 'Abgabeoptionen',
    'pickupArea': 'Abholbereich',
    'dropoffArea': 'Abgabebereich',
    'selectPickup': 'Abholung auswählen',
    'selectDropoff': 'Abgabe auswählen',
    'hotelAddress': 'Hotel / Adresse',
    'enterHotelAddress': 'Hotel oder Adresse eingeben',
    'privatePickup': 'Privater Transfer',
    'privateDropoff': 'Private Abgabe',
    'numberOfPassengers': 'Anzahl Passagiere',
    'car': 'PRIVATES Auto',
    'minibus': 'PRIVATER Minibus',
    'maxPax': 'max. {count} Pers.',
    'forOneWay': 'einfache Fahrt',
    'minBefore': '{minutes} Min vorher',
    'noPickupAvailable': 'Kein Abholservice für diesen Hafen verfügbar.',
    'noDropoffAvailable': 'Kein Abgabeservice für diesen Hafen verfügbar.',
    
    // Shopping cart
    'yourTrips': 'Ihre Reisen',
    'tickets': 'Tickets',
    'selectTripToSeeSummary': 'Wählen Sie eine Fahrt zur Übersicht',
    'grandTotal': 'Gesamtsumme',
    'promoCode': 'Aktionscode',
    'enterPromoCode': 'Aktionscode eingeben',
    'bookOtherTrip': 'Andere Fahrt buchen',
    'proceedToCheckout': 'Zur Kasse',
    'boatInfo': 'Boot-Info',
    
    // Checkout
    'checkout': 'Kasse',
    'contactDetails': 'Kontaktdaten',
    'fullName': 'Vollständiger Name',
    'email': 'E-Mail',
    'phone': 'Telefon',
    'country': 'Land',
    'specialRequests': 'Besondere Wünsche',
    'termsAndConditions': 'AGB',
    'iAgreeToTerms': 'Ich akzeptiere die AGB',
    'payNow': 'Jetzt bezahlen',
    'payLater': 'Später bezahlen',
    'bookNow': 'Jetzt buchen',
    
    // Booking success
    'bookingConfirmed': 'Buchung bestätigt!',
    'bookingReference': 'Buchungsnummer',
    'thankYou': 'Vielen Dank für Ihre Buchung',
    'confirmationSent': 'Eine Bestätigungs-E-Mail wurde an Ihre Adresse gesendet.',
    'downloadTicket': 'Ticket herunterladen',
    'bookAnother': 'Weitere Fahrt buchen',
    
    // Private boat
    'selectBoat': 'Boot auswählen',
    'boatDetails': 'Boot-Details',
    'capacity': 'Kapazität',
    'description': 'Beschreibung',
    'selectDate': 'Datum auswählen',
    'selectTime': 'Uhrzeit auswählen',
    
    // Errors
    'errorOccurred': 'Ein Fehler ist aufgetreten',
    'tryAgain': 'Erneut versuchen',
    'required': 'Erforderlich',
    'invalidEmail': 'Ungültige E-Mail-Adresse',
    'invalidPhone': 'Ungültige Telefonnummer',
  },
  
  nl: {
    // General
    'select': 'Selecteren',
    'back': 'Terug',
    'next': 'Volgende',
    'confirm': 'Bevestigen',
    'apply': 'Toepassen',
    'delete': 'Verwijderen',
    'included': 'Inbegrepen',
    'loading': 'Laden...',
    'noResults': 'Geen resultaten gevonden',
    
    // Service type
    'serviceType': 'Type dienst',
    'sharedBoat': 'Gedeelde boot',
    'privateBoat': 'Privéboot',
    'sharedBoatDesc': 'Reis met andere passagiers volgens vaste tijden',
    'privateBoatDesc': 'Exclusieve bootcharter voor uw groep',
    
    // Route selection
    'selectRoute': 'Route selecteren',
    'from': 'Van',
    'to': 'Naar',
    'selectOrigin': 'Selecteer vertrekpunt',
    'selectDestination': 'Selecteer bestemming',
    'tripType': 'Type reis',
    'oneWay': 'Enkele reis',
    'roundTrip': 'Retour',
    'departureDate': 'Vertrekdatum',
    'returnDate': 'Retourdatum',
    'searchTrips': 'Zoek reizen',
    
    // Passengers
    'passengers': 'Passagiers',
    'adult': 'Volwassene',
    'adults': 'Volwassenen',
    'child': 'Kind',
    'children': 'Kinderen',
    'infant': 'Baby',
    'infants': "Baby's",
    'yearsOld': 'jaar oud',
    'underYears': 'onder {years} jaar',
    'adultAge': 'Volwassene (12+)',
    'childAge': 'Kind (2-12)',
    'infantAge': 'Baby (0-2)',
    
    // Departures
    'selectDeparture': 'Vertrek selecteren',
    'availableTrips': 'Beschikbare reizen',
    'noTripsAvailable': 'Geen reizen beschikbaar voor deze datum',
    'seatsAvailable': 'plaatsen beschikbaar',
    'departure': 'Vertrek',
    'arrival': 'Aankomst',
    'duration': 'Duur',
    'minutes': 'min',
    
    // Addons
    'addons': "Extra's",
    'optionalAddons': "Optionele extra's",
    'selectAddons': "Extra's selecteren",
    
    // Pickup/Dropoff
    'pickup': 'Ophalen',
    'dropoff': 'Afzetten',
    'pickupOptions': 'Ophaalopties',
    'dropoffOptions': 'Afzetopties',
    'pickupArea': 'Ophaalgebied',
    'dropoffArea': 'Afzetgebied',
    'selectPickup': 'Selecteer ophaallocatie',
    'selectDropoff': 'Selecteer afzetlocatie',
    'hotelAddress': 'Hotel / Adres',
    'enterHotelAddress': 'Voer uw hotel of adres in',
    'privatePickup': 'Privé vervoer',
    'privateDropoff': 'Privé afzetten',
    'numberOfPassengers': 'Aantal passagiers',
    'car': 'PRIVÉ Auto',
    'minibus': 'PRIVÉ Minibus',
    'maxPax': 'max. {count} pers.',
    'forOneWay': 'enkele reis',
    'minBefore': '{minutes} min voor',
    'noPickupAvailable': 'Geen ophaalservice beschikbaar voor deze haven.',
    'noDropoffAvailable': 'Geen afzetservice beschikbaar voor deze haven.',
    
    // Shopping cart
    'yourTrips': 'Uw reizen',
    'tickets': 'Tickets',
    'selectTripToSeeSummary': 'Selecteer een reis om samenvatting te zien',
    'grandTotal': 'Totaal',
    'promoCode': 'Actiecode',
    'enterPromoCode': 'Voer actiecode in',
    'bookOtherTrip': 'Andere reis boeken',
    'proceedToCheckout': 'Naar afrekenen',
    'boatInfo': 'Boot info',
    
    // Checkout
    'checkout': 'Afrekenen',
    'contactDetails': 'Contactgegevens',
    'fullName': 'Volledige naam',
    'email': 'E-mail',
    'phone': 'Telefoon',
    'country': 'Land',
    'specialRequests': 'Speciale verzoeken',
    'termsAndConditions': 'Algemene voorwaarden',
    'iAgreeToTerms': 'Ik ga akkoord met de voorwaarden',
    'payNow': 'Nu betalen',
    'payLater': 'Later betalen',
    'bookNow': 'Nu boeken',
    
    // Booking success
    'bookingConfirmed': 'Boeking bevestigd!',
    'bookingReference': 'Boekingsnummer',
    'thankYou': 'Bedankt voor uw boeking',
    'confirmationSent': 'Een bevestigingsmail is naar uw adres gestuurd.',
    'downloadTicket': 'Ticket downloaden',
    'bookAnother': 'Andere reis boeken',
    
    // Private boat
    'selectBoat': 'Boot selecteren',
    'boatDetails': 'Boot details',
    'capacity': 'Capaciteit',
    'description': 'Beschrijving',
    'selectDate': 'Datum selecteren',
    'selectTime': 'Tijd selecteren',
    
    // Errors
    'errorOccurred': 'Er is een fout opgetreden',
    'tryAgain': 'Opnieuw proberen',
    'required': 'Verplicht',
    'invalidEmail': 'Ongeldig e-mailadres',
    'invalidPhone': 'Ongeldig telefoonnummer',
  },
  
  id: {
    // General
    'select': 'Pilih',
    'back': 'Kembali',
    'next': 'Lanjut',
    'confirm': 'Konfirmasi',
    'apply': 'Terapkan',
    'delete': 'Hapus',
    'included': 'Termasuk',
    'loading': 'Memuat...',
    'noResults': 'Tidak ada hasil',
    
    // Service type
    'serviceType': 'Jenis Layanan',
    'sharedBoat': 'Kapal Bersama',
    'privateBoat': 'Kapal Pribadi',
    'sharedBoatDesc': 'Bepergian dengan penumpang lain sesuai jadwal',
    'privateBoatDesc': 'Charter kapal eksklusif untuk grup Anda',
    'publicFastFerry': 'Ferry Cepat Umum',
    
    // Route selection
    'selectRoute': 'Pilih Rute',
    'from': 'Dari',
    'to': 'Ke',
    'selectOrigin': 'Pilih asal',
    'selectDestination': 'Pilih tujuan',
    'selectDeparture': 'Pilih keberangkatan',
    'tripType': 'Jenis Perjalanan',
    'oneWay': 'Sekali Jalan',
    'roundTrip': 'Pulang Pergi',
    'departureDate': 'Tanggal Berangkat',
    'returnDate': 'Tanggal Kembali',
    'searchTrips': 'Cari Perjalanan',
    'selectVoyage': 'Pilih perjalanan',
    'bookTickets': 'Pesan Tiket',
    
    // Passengers
    'passengers': 'Penumpang',
    'adult': 'Dewasa',
    'adults': 'Dewasa',
    'child': 'Anak',
    'children': 'Anak-anak',
    'infant': 'Bayi',
    'infants': 'Bayi',
    'yearsOld': 'tahun',
    'underYears': 'di bawah {years} tahun',
    'adultAge': 'Dewasa (12+)',
    'childAge': 'Anak (2-12)',
    'infantAge': 'Bayi (0-2)',
    
    // Departures
    'availableTrips': 'Perjalanan Tersedia',
    'noTripsAvailable': 'Tidak ada perjalanan untuk tanggal ini',
    'seatsAvailable': 'kursi tersedia',
    'departure': 'Keberangkatan',
    'arrival': 'Kedatangan',
    'duration': 'Durasi',
    'minutes': 'menit',
    
    // Addons
    'addons': 'Tambahan',
    'optionalAddons': 'Tambahan Opsional',
    'selectAddons': 'Pilih Tambahan',
    
    // Pickup/Dropoff
    'pickup': 'Jemput',
    'dropoff': 'Antar',
    'pickupOptions': 'Opsi Penjemputan',
    'dropoffOptions': 'Opsi Pengantaran',
    'pickupArea': 'Area Penjemputan',
    'dropoffArea': 'Area Pengantaran',
    'selectPickup': 'Pilih penjemputan',
    'selectDropoff': 'Pilih pengantaran',
    'hotelAddress': 'Hotel / Alamat',
    'enterHotelAddress': 'Masukkan hotel atau alamat Anda',
    'privatePickup': 'Jemput Pribadi',
    'privateDropoff': 'Antar Pribadi',
    'numberOfPassengers': 'Jumlah penumpang',
    'car': 'Mobil PRIBADI',
    'minibus': 'Minibus PRIBADI',
    'maxPax': 'maks {count} orang',
    'forOneWay': 'sekali jalan',
    'minBefore': '{minutes} menit sebelum',
    'noPickupAvailable': 'Tidak ada layanan penjemputan untuk pelabuhan ini.',
    'noDropoffAvailable': 'Tidak ada layanan pengantaran untuk pelabuhan ini.',
    
    // Shopping cart
    'yourTrips': 'Perjalanan Anda',
    'tickets': 'Tiket',
    'selectTripToSeeSummary': 'Pilih perjalanan untuk melihat ringkasan',
    'grandTotal': 'Total',
    'promoCode': 'Kode Promo',
    'enterPromoCode': 'Masukkan kode promo',
    'bookOtherTrip': 'Pesan perjalanan lain',
    'proceedToCheckout': 'Lanjut ke Pembayaran',
    'boatInfo': 'Info Kapal',
    
    // Checkout
    'checkout': 'Pembayaran',
    'contactDetails': 'Detail Kontak',
    'fullName': 'Nama Lengkap',
    'email': 'Email',
    'phone': 'Telepon',
    'country': 'Negara',
    'specialRequests': 'Permintaan Khusus',
    'termsAndConditions': 'Syarat dan Ketentuan',
    'iAgreeToTerms': 'Saya setuju dengan syarat dan ketentuan',
    'payNow': 'Bayar Sekarang',
    'payLater': 'Bayar Nanti',
    'bookNow': 'Pesan Sekarang',
    
    // Booking success
    'bookingConfirmed': 'Pemesanan Dikonfirmasi!',
    'bookingReference': 'Nomor Referensi',
    'thankYou': 'Terima kasih atas pemesanan Anda',
    'confirmationSent': 'Email konfirmasi telah dikirim ke alamat Anda.',
    'downloadTicket': 'Unduh Tiket',
    'bookAnother': 'Pesan Perjalanan Lain',
    
    // Private boat
    'selectBoat': 'Pilih Kapal',
    'boatDetails': 'Detail Kapal',
    'capacity': 'Kapasitas',
    'description': 'Deskripsi',
    'selectDate': 'Pilih Tanggal',
    'selectTime': 'Pilih Waktu',
    'departureTime': 'Waktu Keberangkatan',
    'route': 'Rute',
    
    // Errors
    'errorOccurred': 'Terjadi kesalahan',
    'tryAgain': 'Coba Lagi',
    'required': 'Wajib diisi',
    'invalidEmail': 'Alamat email tidak valid',
    'invalidPhone': 'Nomor telepon tidak valid',
  },
  
  ko: {
    // General
    'select': '선택',
    'back': '뒤로',
    'next': '다음',
    'confirm': '확인',
    'apply': '적용',
    'delete': '삭제',
    'included': '포함',
    'loading': '로딩 중...',
    'noResults': '결과 없음',
    
    // Service type
    'serviceType': '서비스 유형',
    'sharedBoat': '공유 보트',
    'privateBoat': '전세 보트',
    'sharedBoatDesc': '다른 승객과 함께 정해진 시간에 이동',
    'privateBoatDesc': '귀하의 그룹을 위한 전용 보트 대여',
    'publicFastFerry': '공공 고속 페리',
    
    // Route selection
    'selectRoute': '노선 선택',
    'from': '출발',
    'to': '도착',
    'selectOrigin': '출발지 선택',
    'selectDestination': '목적지 선택',
    'selectDeparture': '출발 선택',
    'tripType': '여행 유형',
    'oneWay': '편도',
    'roundTrip': '왕복',
    'departureDate': '출발 날짜',
    'returnDate': '귀국 날짜',
    'searchTrips': '여행 검색',
    'selectVoyage': '항해 선택',
    'bookTickets': '티켓 예약',
    
    // Passengers
    'passengers': '승객',
    'adult': '성인',
    'adults': '성인',
    'child': '어린이',
    'children': '어린이',
    'infant': '유아',
    'infants': '유아',
    'yearsOld': '세',
    'underYears': '{years}세 미만',
    'adultAge': '성인 (12+)',
    'childAge': '어린이 (2-12)',
    'infantAge': '유아 (0-2)',
    
    // Departures
    'availableTrips': '이용 가능한 여행',
    'noTripsAvailable': '이 날짜에 이용 가능한 여행이 없습니다',
    'seatsAvailable': '좌석 이용 가능',
    'departure': '출발',
    'arrival': '도착',
    'duration': '소요 시간',
    'minutes': '분',
    
    // Addons
    'addons': '추가 옵션',
    'optionalAddons': '선택 추가 옵션',
    'selectAddons': '추가 옵션 선택',
    
    // Pickup/Dropoff
    'pickup': '픽업',
    'dropoff': '하차',
    'pickupOptions': '픽업 옵션',
    'dropoffOptions': '하차 옵션',
    'pickupArea': '픽업 지역',
    'dropoffArea': '하차 지역',
    'selectPickup': '픽업 선택',
    'selectDropoff': '하차 선택',
    'hotelAddress': '호텔 / 주소',
    'enterHotelAddress': '호텔 또는 주소 입력',
    'privatePickup': '개인 픽업',
    'privateDropoff': '개인 하차',
    'numberOfPassengers': '승객 수',
    'car': '개인 자동차',
    'minibus': '개인 미니버스',
    'maxPax': '최대 {count}명',
    'forOneWay': '편도',
    'minBefore': '{minutes}분 전',
    'noPickupAvailable': '이 항구에서 픽업 서비스를 이용할 수 없습니다.',
    'noDropoffAvailable': '이 항구에서 하차 서비스를 이용할 수 없습니다.',
    
    // Shopping cart
    'yourTrips': '내 여행',
    'tickets': '티켓',
    'selectTripToSeeSummary': '요약을 보려면 여행을 선택하세요',
    'grandTotal': '총액',
    'promoCode': '프로모션 코드',
    'enterPromoCode': '프로모션 코드 입력',
    'bookOtherTrip': '다른 여행 예약',
    'proceedToCheckout': '결제로 진행',
    'boatInfo': '보트 정보',
    
    // Checkout
    'checkout': '결제',
    'contactDetails': '연락처 정보',
    'fullName': '성명',
    'email': '이메일',
    'phone': '전화번호',
    'country': '국가',
    'specialRequests': '특별 요청',
    'termsAndConditions': '이용약관',
    'iAgreeToTerms': '이용약관에 동의합니다',
    'payNow': '지금 결제',
    'payLater': '나중에 결제',
    'bookNow': '지금 예약',
    
    // Booking success
    'bookingConfirmed': '예약 완료!',
    'bookingReference': '예약 번호',
    'thankYou': '예약해 주셔서 감사합니다',
    'confirmationSent': '확인 이메일이 발송되었습니다.',
    'downloadTicket': '티켓 다운로드',
    'bookAnother': '다른 여행 예약',
    
    // Private boat
    'selectBoat': '보트 선택',
    'boatDetails': '보트 상세 정보',
    'capacity': '수용 인원',
    'description': '설명',
    'selectDate': '날짜 선택',
    'selectTime': '시간 선택',
    'departureTime': '출발 시간',
    'route': '노선',
    
    // Errors
    'errorOccurred': '오류가 발생했습니다',
    'tryAgain': '다시 시도',
    'required': '필수',
    'invalidEmail': '잘못된 이메일 주소',
    'invalidPhone': '잘못된 전화번호',
  },
};

interface CurrencyContextType {
  currency: SupportedCurrency;
  setCurrency: (curr: SupportedCurrency) => void;
  convertPrice: (priceInIDR: number) => number;
  formatPrice: (priceInIDR: number) => string;
  getCurrencyConfig: () => CurrencyConfig;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const WidgetLanguageProvider = ({ children, defaultLanguage = 'en' }: { children: ReactNode; defaultLanguage?: SupportedLanguage }) => {
  const [language, setLanguage] = useState<SupportedLanguage>(defaultLanguage);
  const [currency, setCurrency] = useState<SupportedCurrency>('IDR');

  const t = (key: string, params?: Record<string, string | number>): string => {
    let text = translations[language]?.[key] || translations['en']?.[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };

  const getCurrencyConfig = (): CurrencyConfig => {
    return CURRENCY_CONFIG.find(c => c.code === currency) || CURRENCY_CONFIG[0];
  };

  const convertPrice = (priceInIDR: number): number => {
    const config = getCurrencyConfig();
    return priceInIDR * config.rateFromIDR;
  };

  const formatPrice = (priceInIDR: number): string => {
    const config = getCurrencyConfig();
    const convertedPrice = convertPrice(priceInIDR);
    
    if (config.code === 'IDR') {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(convertedPrice);
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(convertedPrice);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <CurrencyContext.Provider value={{ currency, setCurrency, convertPrice, formatPrice, getCurrencyConfig }}>
        {children}
      </CurrencyContext.Provider>
    </LanguageContext.Provider>
  );
};

export const useWidgetLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useWidgetLanguage must be used within a WidgetLanguageProvider');
  }
  return context;
};

export const useWidgetCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useWidgetCurrency must be used within a WidgetLanguageProvider');
  }
  return context;
};

export const LANGUAGE_OPTIONS: { code: SupportedLanguage; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'id', label: 'Indonesia', flag: '🇮🇩' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
];
