import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  useWindowDimensions,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Linking,
  Alert,
  StatusBar,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Catálogo de promociones con información médica detallada
const PROMOS_DATA = [
  {
    id: '1',
    title: 'Resonancia Magnética Especializada',
    category: 'Resonancias',
    discount: '25% OFF',
    discountBadgeColor: '#D32F2F',
    originalPrice: '$4,200 MXN',
    promoPrice: '$3,150 MXN',
    code: 'MRI-RESO25',
    image: 'https://i.imgur.com/1REXXBB.jpg',
    validity: 'Válido todo el mes',
    description:
      'Descuento especial en resonancia de columna, cráneo, rodilla u hombro en equipos de alta resolución. Incluye interpretación médica certificada.',
    features: [
      'Resonador de última generación',
      'Entrega digital de imágenes y reporte en 24h',
      'Atención personalizada por médicos radiólogos',
      'Válido en sucursales Cuernavaca, Jojutla y Jiutepec',
    ],
    prepNotes: 'Requiere cita previa. Mencionar si cuenta con implantes metálicos o marcapasos.',
  },
  {
    id: '2',
    title: 'Check-Up Preventivo Integral',
    category: 'Check-Ups',
    discount: 'PAQUETE ESPECIAL',
    discountBadgeColor: '#137333',
    originalPrice: '$1,950 MXN',
    promoPrice: '$1,399 MXN',
    code: 'MRI-CHECKUP',
    image: 'https://i.imgur.com/gqVK9eE.jpg',
    validity: 'Lunes a Sábado',
    description:
      'Paquete preventivo que combina análisis de laboratorio completo y radiografía de tórax para conocer tu estado de salud general.',
    features: [
      'Biometría hemática completa (laboratorio)',
      'Química sanguínea de 6 elementos',
      'Examen General de Orina (EGO)',
      'Radiografía de Tórax Digital',
    ],
    prepNotes: 'Ayuno obligatorio de 8 a 10 horas antes de la toma de muestra matutina.',
  },
  {
    id: '3',
    title: 'Mastografía Digital + Ultrasonido',
    category: 'Ultrasonidos',
    discount: '2x1 CUIDADO FEMENINO',
    discountBadgeColor: '#C2185B',
    originalPrice: '$1,600 MXN',
    promoPrice: '$999 MXN',
    code: 'MRI-FEMME',
    image: 'https://i.imgur.com/8oTBcUw.jpg',
    validity: 'Mes de la Mujer y Prevención',
    description:
      'Estudio integral para la detección oportuna del cáncer de mama con tecnología digital de baja radiación y ultrasonido mamario.',
    features: [
      'Mastografía digital de alta definición',
      'Ultrasonido mamario complementario bilateral',
      'Diagnóstico clasificado bajo escala BI-RADS',
      'Personal femenino especializado y trato digno',
    ],
    prepNotes: 'Presentarse sin desodorante, talco ni crema corporal en el área axilar y pecho.',
  },
  {
    id: '4',
    title: 'Tomografía Multicorte con Contraste',
    category: 'Tomografías',
    discount: '20% OFF',
    discountBadgeColor: '#0056BD',
    originalPrice: '$3,600 MXN',
    promoPrice: '$2,880 MXN',
    code: 'MRI-TOMO20',
    image: 'https://i.imgur.com/J9qUC5W.jpg',
    validity: 'Válido todo el mes',
    description:
      'Estudios tomográficos de cráneo, abdomen o tórax con reconstrucción 3D y cortes milimétricos para un diagnóstico de alta precisión.',
    features: [
      'Tomógrafo multicorte de alta velocidad',
      'Reconstrucción tridimensional avanzada',
      'CD/Acceso online a tus imágenes',
      'Interpretación por especialista radiólogo',
    ],
    prepNotes: 'Si requiere medio de contraste, presentar estudio previo de creatinina sérica.',
  },
  {
    id: '5',
    title: 'Perfil Clínico y Químico Completo',
    category: 'Laboratorio',
    discount: '30% OFF',
    discountBadgeColor: '#7B1FA2',
    originalPrice: '$1,200 MXN',
    promoPrice: '$840 MXN',
    code: 'MRI-LAB30',
    image: 'https://i.imgur.com/pvUvtVF.jpg',
    validity: 'De 7:00 am a 11:00 am',
    description:
      'Monitorea colesterol, triglicéridos, glucosa, función hepática y renal con toma de muestra rápida y resultados el mismo día.',
    features: [
      'Perfil lipídico y metabólico completo',
      'Resultados en línea descargables desde la app',
      'Toma de muestra indolora por flebotomistas certificados',
      'Consulta de resultados vía WhatsApp',
    ],
    prepNotes: 'Ayuno estricto de 8 horas previas a la toma de sangre.',
  },
  {
    id: '6',
    title: 'Ultrasonido Doppler Color Vascular',
    category: 'Ultrasonidos',
    discount: 'PRECIO ESPECIAL',
    discountBadgeColor: '#E65100',
    originalPrice: '$1,800 MXN',
    promoPrice: '$1,299 MXN',
    code: 'MRI-DOPPLER',
    image: 'https://i.imgur.com/b4BPimj.jpg',
    validity: 'Vigencia de temporada',
    description:
      'Evaluación circulatoria no invasiva del flujo sanguíneo arterial y venoso en extremidades, carótidas o área abdominal.',
    features: [
      'Evaluación hemodinámica con Doppler color',
      'Identificación de várices, trombos o insuficiencia',
      'Estudio sin radiación ni molestias',
      'Reporte impreso y digital con capturas clave',
    ],
    prepNotes: 'Ropa cómoda; para Doppler abdominal se requiere ayuno de 6 horas.',
  },
];

const CATEGORIES = ['Todos', 'Resonancias', 'Check-Ups', 'Ultrasonidos', 'Tomografías', 'Laboratorio'];

const PromoDesc = () => {
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setRefreshKey(Date.now());
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey(Date.now());
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  }, []);

  const handleCopyCode = (code) => {
    // Intento seguro de portapapeles sin dependencias externas
    try {
      const rnClipboard = require('react-native').Clipboard;
      if (rnClipboard && rnClipboard.setString) {
        rnClipboard.setString(code);
      }
    } catch (e) {
      // Ignorar si el módulo no está expuesto
    }
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2800);
  };

  const handleWhatsAppBooking = (promo) => {
    const phoneNumber = '+52 1 777 362 0260';
    const message = `¡Hola Imagen Médica MRI! Me interesa aprovechar la promoción de la app:\n\n*${promo.title}*\n• Cupón: *${promo.code}* (${promo.discount})\n• Precio promo: *${promo.promoPrice}*\n\n¿Me podrían brindar horarios disponibles para agendar?`;
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;

    Linking.openURL(url).catch(() => {
      Linking.openURL(
        `https://wa.me/5217773620260?text=${encodeURIComponent(message)}`
      ).catch(() => {
        Alert.alert('Atención', 'No se pudo abrir WhatsApp. Puedes contactarnos al 777 362 0260.');
      });
    });
  };

  const handleOpenPromoDetail = (promo) => {
    setSelectedPromo(promo);
    setModalVisible(true);
  };

  const handleGeneralWhatsApp = () => {
    const phoneNumber = '+52 1 777 362 0260';
    const message = '¡Hola Imagen Médica MRI! Quiero consultar sobre las promociones y paquetes disponibles.';
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://wa.me/5217773620260?text=${encodeURIComponent(message)}`);
    });
  };

  // Filtrado de promociones
  const filteredPromos = PROMOS_DATA.filter((promo) => {
    const matchesCategory =
      selectedCategory === 'Todos' || promo.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      promo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      promo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      promo.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      promo.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER SUPERIOR */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'))}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#000684" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Promociones & Descuentos</Text>
          <Text style={styles.headerSubtitle}>Tarifas preferenciales y beneficios</Text>
        </View>

        <TouchableOpacity
          style={styles.headerWhatsAppButton}
          onPress={handleGeneralWhatsApp}
          activeOpacity={0.7}
        >
          <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
        </TouchableOpacity>
      </View>

      {/* CONTENIDO SCROLLABLE */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#000684']} />}
      >
        {/* HERO BANNER DESTACADO */}
        <View style={styles.heroCard}>
          <Image
            source={{ uri: `https://i.imgur.com/qTAL2nQ.png?${refreshKey}` }}
            style={[styles.heroImage, { width: width - 32, height: (width - 32) * 0.44 }]}
          />
          <View style={styles.heroOverlay}>
            <View style={styles.heroBadge}>
              <Ionicons name="flame" size={14} color="#FFF" style={{ marginRight: 4 }} />
              <Text style={styles.heroBadgeText}>OFERTAS EXCLUSIVAS DEL MES</Text>
            </View>
            <Text style={styles.heroTitle}>Ahorra en tus estudios de diagnóstico</Text>
            <Text style={styles.heroSubtitle}>Aplica tus cupones digitales directamente por WhatsApp o en ventanilla.</Text>
          </View>
        </View>

        {/* TARJETA MONEDERO ELECTRÓNICO BENEFIT */}
        <View style={styles.walletCard}>
          <View style={styles.walletIconContainer}>
            <Ionicons name="wallet" size={26} color="#137333" />
          </View>
          <View style={styles.walletTextContainer}>
            <View style={styles.walletTitleRow}>
              <Text style={styles.walletTitle}>Monedero Electrónico MRI</Text>
              <View style={styles.walletTag}>
                <Text style={styles.walletTagText}>+$100 OFF</Text>
              </View>
            </View>
            <Text style={styles.walletDesc}>
              Ahorra $100.00 MXN adicionales en tus estudios al usar el saldo de tu monedero registrado en la app.
            </Text>
          </View>
        </View>

        {/* BARRA DE BÚSQUEDA */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#8A9BA8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar estudio, ultrasonido o cupón..."
            placeholderTextColor="#8A9BA8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color="#8A9BA8" />
            </TouchableOpacity>
          )}
        </View>

        {/* SELECTOR DE CATEGORÍAS EN CHIPS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.75}
              >
                <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* FEEDBACK CUANDO SE COPIA UN CÓDIGO */}
        {copiedCode && (
          <View style={styles.toastContainer}>
            <Ionicons name="checkmark-circle" size={18} color="#25D366" style={{ marginRight: 6 }} />
            <Text style={styles.toastText}>
              ¡Cupón <Text style={{ fontWeight: 'bold' }}>{copiedCode}</Text> copiado! Listo para agendar por WhatsApp.
            </Text>
          </View>
        )}

        {/* TÍTULO DE LISTADO Y CONTEO */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'Todos' ? 'Todas las Promociones' : `Promociones de ${selectedCategory}`}
          </Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{filteredPromos.length} disponibles</Text>
          </View>
        </View>

        {/* LISTADO DE TARJETAS DE PROMOCIÓN */}
        {filteredPromos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="pricetag-outline" size={48} color="#BDC3C7" />
            <Text style={styles.emptyTitle}>No encontramos promociones</Text>
            <Text style={styles.emptySubtitle}>Intenta con otra palabra clave o selecciona otra categoría.</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory('Todos');
              }}
            >
              <Text style={styles.emptyButtonText}>Ver todas las promociones</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredPromos.map((promo) => (
            <View key={promo.id} style={styles.promoCard}>
              {/* IMAGEN DE LA PROMO CON BADGES */}
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handleOpenPromoDetail(promo)}
                style={styles.cardImageContainer}
              >
                <Image
                  source={{ uri: `${promo.image}?${refreshKey}` }}
                  style={styles.promoCardImage}
                />
                {/* BADGE DESCUENTO */}
                <View style={[styles.cardDiscountBadge, { backgroundColor: promo.discountBadgeColor }]}>
                  <Text style={styles.cardDiscountBadgeText}>{promo.discount}</Text>
                </View>

                {/* BADGE CATEGORIA */}
                <View style={styles.cardCategoryBadge}>
                  <Text style={styles.cardCategoryBadgeText}>{promo.category}</Text>
                </View>
              </TouchableOpacity>

              {/* CONTENIDO DE LA TARJETA */}
              <View style={styles.cardBody}>
                <TouchableOpacity activeOpacity={0.8} onPress={() => handleOpenPromoDetail(promo)}>
                  <Text style={styles.cardTitle}>{promo.title}</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {promo.description}
                  </Text>
                </TouchableOpacity>

                {/* PRECIOS Y VIGENCIA */}
                <View style={styles.pricingRow}>
                  <View>
                    <Text style={styles.priceLabel}>Precio especial:</Text>
                    <View style={styles.priceValuesRow}>
                      <Text style={styles.promoPriceText}>{promo.promoPrice}</Text>
                      <Text style={styles.originalPriceText}>{promo.originalPrice}</Text>
                    </View>
                  </View>
                  <View style={styles.validityTag}>
                    <Ionicons name="time-outline" size={13} color="#555" style={{ marginRight: 3 }} />
                    <Text style={styles.validityText}>{promo.validity}</Text>
                  </View>
                </View>

                {/* CUPÓN DE DESCUENTO CON ACCIÓN DE COPIA */}
                <View style={styles.couponRow}>
                  <View style={styles.couponBox}>
                    <Ionicons name="pricetag" size={14} color="#000684" style={{ marginRight: 5 }} />
                    <Text style={styles.couponCodeText}>{promo.code}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() => handleCopyCode(promo.code)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={copiedCode === promo.code ? 'checkmark' : 'copy-outline'}
                      size={14}
                      color="#000684"
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.copyButtonText}>
                      {copiedCode === promo.code ? '¡Copiado!' : 'Copiar Cupón'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* BOTONES DE ACCIÓN */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.detailButton}
                    onPress={() => handleOpenPromoDetail(promo)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="information-circle-outline" size={16} color="#000684" style={{ marginRight: 4 }} />
                    <Text style={styles.detailButtonText}>Ver Detalles</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.whatsAppButton}
                    onPress={() => handleWhatsAppBooking(promo)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.whatsAppButtonText}>Agendar Promo</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}

        {/* NOTA DE TÉRMINOS Y CONDICIONES */}
        <View style={styles.footerNotice}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#8A9BA8" style={{ marginBottom: 4 }} />
          <Text style={styles.footerNoticeText}>
            Promociones válidas en clínicas Imagen Médica MRI. Precios en MXN, aplican restricciones. No acumulable con otras ofertas salvo Monedero Electrónico.
          </Text>
        </View>
      </ScrollView>

      {/* MODAL DETALLE DE PROMOCIÓN */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* ENCABEZADO DEL MODAL */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalHeaderTitle}>Detalles de la Promoción</Text>
                <Text style={styles.modalHeaderSub}>Imagen Médica MRI</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedPromo && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                {/* IMAGEN GRANDE */}
                <View style={styles.modalImageContainer}>
                  <Image
                    source={{ uri: `${selectedPromo.image}?${refreshKey}` }}
                    style={styles.modalImage}
                  />
                  <View style={[styles.modalDiscountBadge, { backgroundColor: selectedPromo.discountBadgeColor }]}>
                    <Text style={styles.modalDiscountBadgeText}>{selectedPromo.discount}</Text>
                  </View>
                </View>

                {/* TÍTULO Y PRECIOS */}
                <Text style={styles.modalPromoTitle}>{selectedPromo.title}</Text>
                <View style={styles.modalCategoryRow}>
                  <View style={styles.modalCategoryChip}>
                    <Text style={styles.modalCategoryChipText}>{selectedPromo.category}</Text>
                  </View>
                  <View style={styles.modalValidityChip}>
                    <Ionicons name="calendar-outline" size={13} color="#000684" style={{ marginRight: 4 }} />
                    <Text style={styles.modalValidityChipText}>{selectedPromo.validity}</Text>
                  </View>
                </View>

                {/* PRECIO DESTACADO */}
                <View style={styles.modalPricingCard}>
                  <View>
                    <Text style={styles.modalPriceLabel}>Precio exclusivo con cupón:</Text>
                    <View style={styles.modalPriceNumbers}>
                      <Text style={styles.modalPromoPrice}>{selectedPromo.promoPrice}</Text>
                      <Text style={styles.modalOriginalPrice}>{selectedPromo.originalPrice}</Text>
                    </View>
                  </View>
                  <View style={styles.savingsTag}>
                    <Text style={styles.savingsTagText}>Ahorro garantizado</Text>
                  </View>
                </View>

                {/* DESCRIPCIÓN */}
                <Text style={styles.modalSectionHeading}>Descripción del Servicio</Text>
                <Text style={styles.modalDescription}>{selectedPromo.description}</Text>

                {/* QUÉ INCLUYE */}
                <Text style={styles.modalSectionHeading}>¿Qué incluye este estudio?</Text>
                <View style={styles.modalFeaturesList}>
                  {selectedPromo.features?.map((item, index) => (
                    <View key={index} style={styles.modalFeatureItem}>
                      <Ionicons name="checkmark-circle" size={18} color="#137333" style={{ marginRight: 8, marginTop: 1 }} />
                      <Text style={styles.modalFeatureText}>{item}</Text>
                    </View>
                  ))}
                </View>

                {/* INDICACIONES */}
                <View style={styles.modalPrepCard}>
                  <Ionicons name="information-circle" size={20} color="#0056BD" style={{ marginRight: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalPrepTitle}>Indicaciones y Preparación:</Text>
                    <Text style={styles.modalPrepText}>{selectedPromo.prepNotes}</Text>
                  </View>
                </View>

                {/* CUPÓN DE DESCUENTO */}
                <View style={styles.modalCouponContainer}>
                  <View>
                    <Text style={styles.modalCouponLabel}>CÓDIGO DE PROMOCIÓN</Text>
                    <Text style={styles.modalCouponCode}>{selectedPromo.code}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.modalCopyBtn}
                    onPress={() => handleCopyCode(selectedPromo.code)}
                  >
                    <Ionicons
                      name={copiedCode === selectedPromo.code ? 'checkmark-circle' : 'copy'}
                      size={16}
                      color="#000684"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.modalCopyBtnText}>
                      {copiedCode === selectedPromo.code ? '¡Copiado!' : 'Copiar'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* BOTÓN WHATSAPP */}
                <TouchableOpacity
                  style={styles.modalWhatsAppButton}
                  onPress={() => {
                    setModalVisible(false);
                    handleWhatsAppBooking(selectedPromo);
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" style={{ marginRight: 10 }} />
                  <Text style={styles.modalWhatsAppButtonText}>Agendar Cita con este Descuento</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalCloseAltButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalCloseAltText}>Cerrar ventana</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEFF5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F4FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000684',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7A8D',
    marginTop: 1,
  },
  headerWhatsAppButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F8EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },

  // HERO CARD
  heroCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000684',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  heroImage: {
    resizeMode: 'cover',
  },
  heroOverlay: {
    padding: 14,
    backgroundColor: 'rgba(0, 6, 132, 0.92)',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  heroSubtitle: {
    color: '#E0E6F0',
    fontSize: 12,
    lineHeight: 17,
  },

  // MONEDERO CARD
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#CBE7D3',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  walletIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E6F4EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  walletTextContainer: {
    flex: 1,
  },
  walletTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  walletTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#137333',
  },
  walletTag: {
    backgroundColor: '#137333',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  walletTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  walletDesc: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 16,
  },

  // BÚSQUEDA
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A202C',
    padding: 0,
  },

  // CATEGORÍAS CHIPS
  categoryScroll: {
    paddingBottom: 14,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#DCE3EB',
  },
  categoryChipActive: {
    backgroundColor: '#000684',
    borderColor: '#000684',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#556575',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  // TOAST
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8EE',
    borderWidth: 1,
    borderColor: '#A3E3B6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  toastText: {
    flex: 1,
    fontSize: 12,
    color: '#137333',
  },

  // LIST HEADER
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  countBadge: {
    backgroundColor: '#E8EDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#000684',
  },

  // TARJETAS DE PROMO
  promoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E6ECF5',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  cardImageContainer: {
    position: 'relative',
    height: 160,
    backgroundColor: '#F0F3F8',
  },
  promoCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardDiscountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  cardDiscountBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  cardCategoryBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0, 6, 132, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardCategoryBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },

  // CARD BODY
  cardBody: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  priceValuesRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  promoPriceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000684',
    marginRight: 8,
  },
  originalPriceText: {
    fontSize: 13,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  validityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  validityText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },

  // CUPÓN
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F4FA',
    borderRadius: 10,
    padding: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  couponBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponCodeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000684',
    letterSpacing: 1,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D0DCEE',
  },
  copyButtonText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000684',
  },

  // ACCIONES DE LA TARJETA
  cardActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  detailButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  detailButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000684',
  },
  whatsAppButton: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#25D366',
    elevation: 2,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  whatsAppButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // ESTADO VACÍO
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6ECF5',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#000684',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },

  // FOOTER AVISO
  footerNotice: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  footerNoticeText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000684',
  },
  modalHeaderSub: {
    fontSize: 12,
    color: '#64748B',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScroll: {
    padding: 20,
    paddingBottom: 30,
  },
  modalImageContainer: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  modalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  modalDiscountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  modalDiscountBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalPromoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 10,
  },
  modalCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  modalCategoryChip: {
    backgroundColor: '#F0F4FA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modalCategoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000684',
  },
  modalValidityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modalValidityChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  modalPricingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  modalPriceLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 3,
  },
  modalPriceNumbers: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  modalPromoPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000684',
    marginRight: 8,
  },
  modalOriginalPrice: {
    fontSize: 14,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  savingsTag: {
    backgroundColor: '#E8F8EE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A3E3B6',
  },
  savingsTagText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#137333',
  },
  modalSectionHeading: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 16,
  },
  modalFeaturesList: {
    marginBottom: 16,
  },
  modalFeatureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  modalFeatureText: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  modalPrepCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  modalPrepTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1D4ED8',
    marginBottom: 2,
  },
  modalPrepText: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 17,
  },
  modalCouponContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F4FA',
    borderWidth: 1,
    borderColor: '#CBDCF0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
  },
  modalCouponLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  modalCouponCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000684',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  modalCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBDCF0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalCopyBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000684',
  },
  modalWhatsAppButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginBottom: 12,
  },
  modalWhatsAppButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalCloseAltButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  modalCloseAltText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
});

export default PromoDesc;

