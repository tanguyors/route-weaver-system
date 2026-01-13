import { createContext, useContext, useState, ReactNode } from 'react';

export type SupportedLanguage = 'en' | 'fr' | 'ru' | 'zh' | 'es' | 'de' | 'nl';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
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
    'pickupArea': 'Pickup area',
    'selectPickup': 'Select pickup',
    'hotelAddress': 'Hotel / Address',
    'enterHotelAddress': 'Enter your hotel or address',
    'shuttleRates': 'Shuttle Rates',
    'numberOfPassengers': 'Number of passengers',
    'car': 'Car',
    'minibus': 'Minibus',
    'maxPax': 'max {count} pax',
    'minBefore': '{minutes} min before',
    'noPickupAvailable': 'No pickup services available for this departure port.',
    
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
    'pickupArea': 'Zone de prise en charge',
    'selectPickup': 'Sélectionner la prise en charge',
    'hotelAddress': 'Hôtel / Adresse',
    'enterHotelAddress': 'Entrez votre hôtel ou adresse',
    'shuttleRates': 'Tarifs navette',
    'numberOfPassengers': 'Nombre de passagers',
    'car': 'Voiture',
    'minibus': 'Minibus',
    'maxPax': 'max {count} pers.',
    'minBefore': '{minutes} min avant',
    'noPickupAvailable': 'Aucun service de prise en charge disponible pour ce port.',
    
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
    'pickupArea': 'Зона посадки',
    'selectPickup': 'Выбрать трансфер',
    'hotelAddress': 'Отель / Адрес',
    'enterHotelAddress': 'Введите название отеля или адрес',
    'shuttleRates': 'Тарифы трансфера',
    'numberOfPassengers': 'Количество пассажиров',
    'car': 'Машина',
    'minibus': 'Микроавтобус',
    'maxPax': 'макс. {count} чел.',
    'minBefore': '{minutes} мин до',
    'noPickupAvailable': 'Трансфер недоступен для этого порта.',
    
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
    'pickupArea': '接送区域',
    'selectPickup': '选择接送地点',
    'hotelAddress': '酒店/地址',
    'enterHotelAddress': '输入酒店或地址',
    'shuttleRates': '接送费用',
    'numberOfPassengers': '乘客人数',
    'car': '轿车',
    'minibus': '小巴',
    'maxPax': '最多{count}人',
    'minBefore': '提前{minutes}分钟',
    'noPickupAvailable': '该港口无接送服务。',
    
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
    'pickupArea': 'Zona de recogida',
    'selectPickup': 'Seleccionar recogida',
    'hotelAddress': 'Hotel / Dirección',
    'enterHotelAddress': 'Ingresa tu hotel o dirección',
    'shuttleRates': 'Tarifas de transporte',
    'numberOfPassengers': 'Número de pasajeros',
    'car': 'Coche',
    'minibus': 'Minibús',
    'maxPax': 'máx. {count} pers.',
    'minBefore': '{minutes} min antes',
    'noPickupAvailable': 'No hay servicio de recogida disponible para este puerto.',
    
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
    'pickupArea': 'Abholbereich',
    'selectPickup': 'Abholung auswählen',
    'hotelAddress': 'Hotel / Adresse',
    'enterHotelAddress': 'Hotel oder Adresse eingeben',
    'shuttleRates': 'Shuttle-Tarife',
    'numberOfPassengers': 'Anzahl Passagiere',
    'car': 'Auto',
    'minibus': 'Minibus',
    'maxPax': 'max. {count} Pers.',
    'minBefore': '{minutes} Min vorher',
    'noPickupAvailable': 'Kein Abholservice für diesen Hafen verfügbar.',
    
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
    'pickupArea': 'Ophaalgebied',
    'selectPickup': 'Selecteer ophaallocatie',
    'hotelAddress': 'Hotel / Adres',
    'enterHotelAddress': 'Voer uw hotel of adres in',
    'shuttleRates': 'Shuttle tarieven',
    'numberOfPassengers': 'Aantal passagiers',
    'car': 'Auto',
    'minibus': 'Minibus',
    'maxPax': 'max. {count} pers.',
    'minBefore': '{minutes} min voor',
    'noPickupAvailable': 'Geen ophaalservice beschikbaar voor deze haven.',
    
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
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const WidgetLanguageProvider = ({ children, defaultLanguage = 'en' }: { children: ReactNode; defaultLanguage?: SupportedLanguage }) => {
  const [language, setLanguage] = useState<SupportedLanguage>(defaultLanguage);

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
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

export const LANGUAGE_OPTIONS: { code: SupportedLanguage; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
];
