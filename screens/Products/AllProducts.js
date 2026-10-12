import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Linking,
  StatusBar,
  useWindowDimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const SERVICES_DATA = [
  {
    id: "analisis-clinicos",
    name: "Análisis Clínicos",
    category: "Laboratorio",
    image: require("../../assets/iconos/Microscopio.png"),
    url: "https://www.mrimagenmedica.com.mx/analisis-clinicos/",
    description: "Química sanguínea, biometría y pruebas especiales de laboratorio.",
  },
  {
    id: "cardiologia",
    name: "Cardiología",
    category: "Especialidad",
    image: require("../../assets/iconos/Cardiología.png"),
    url: "https://www.mrimagenmedica.com.mx/cardiologia/",
    description: "Electrocardiograma y valoración de la salud cardiovascular.",
  },
  {
    id: "colposcopia",
    name: "Colposcopía",
    category: "Salud Femenina",
    image: require("../../assets/iconos/Colposcopía.png"),
    url: "https://www.mrimagenmedica.com.mx/colposcopia/",
    description: "Evaluación especializada y diagnóstico del cuello uterino.",
  },
  {
    id: "densitometria",
    name: "Densitometría",
    category: "Imagenología",
    image: require("../../assets/iconos/Densitometría.png"),
    url: "https://www.mrimagenmedica.com.mx/densitometria-osea/",
    description: "Detección temprana de osteoporosis y densidad mineral ósea.",
  },
  {
    id: "gastroenterologia",
    name: "Gastroenterología",
    category: "Especialidad",
    image: require("../../assets/iconos/Colonoscopia.png"),
    url: "https://www.mrimagenmedica.com.mx/gastroenterologia/",
    description: "Diagnóstico y estudios del tracto digestivo y colon.",
  },
  {
    id: "mastografia",
    name: "Mastografía",
    category: "Salud Femenina",
    image: require("../../assets/iconos/Mastografía.png"),
    url: "https://www.mrimagenmedica.com.mx/mastografia/",
    description: "Mastografía digital de alta definición y baja radiación.",
  },
  {
    id: "neurofisiologia",
    name: "Neurofisiología",
    category: "Especialidad",
    image: require("../../assets/iconos/Neurofisiología.png"),
    url: "https://www.mrimagenmedica.com.mx/neurofisiologia/",
    description: "Electroencefalografía y evaluación del sistema nervioso.",
  },
  {
    id: "rayos-x",
    name: "Rayos X",
    category: "Imagenología",
    image: require("../../assets/iconos/rayos-x.png"),
    url: "https://www.mrimagenmedica.com.mx/rayos-x/",
    description: "Radiografías simples y contrastadas de mínima dosis.",
  },
  {
    id: "resonancia",
    name: "Resonancia Magnética",
    category: "Imagenología",
    image: require("../../assets/iconos/Resonancia.png"),
    url: "https://www.mrimagenmedica.com.mx/resonancia-magnetica/",
    description: "Cráneo, columna y articulaciones en equipo de alta definición.",
  },
  {
    id: "tomografia",
    name: "Tomografía",
    category: "Imagenología",
    image: require("../../assets/iconos/Tomografía.png"),
    url: "https://www.mrimagenmedica.com.mx/tomografia/",
    description: "Tomografía computarizada multicorte con reconstrucción 3D.",
  },
  {
    id: "ultrasonido",
    name: "Ultrasonido",
    category: "Imagenología",
    image: require("../../assets/iconos/Ultrasonido.png"),
    url: "https://www.mrimagenmedica.com.mx/ultrasonido/",
    description: "Ultrasonido general, obstétrico y vascular Doppler color.",
  },
];

const CATEGORIES = ["Todos", "Imagenología", "Especialidad", "Salud Femenina", "Laboratorio"];

const AllProducts = () => {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  const handleOpenInfo = (url) => {
    Linking.openURL(url).catch((err) => console.log("Error al abrir URL:", err));
  };

  const handleWhatsAppQuote = (serviceName) => {
    const phoneNumber = "+52 1 777 362 0260";
    const message = `¡Hola Imagen Médica MRI! Me gustaría solicitar información y cotización del servicio de *${serviceName}*.`;
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://wa.me/5217773620260?text=${encodeURIComponent(message)}`);
    });
  };

  const handleHeaderWhatsApp = () => {
    const phoneNumber = "+52 1 777 362 0260";
    const message = "¡Hola Imagen Médica MRI! Me gustaría consultar sobre sus servicios médicos disponibles.";
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://wa.me/5217773620260?text=${encodeURIComponent(message)}`);
    });
  };

  const filteredServices = SERVICES_DATA.filter((item) => {
    const matchesCategory =
      selectedCategory === "Todos" || item.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER SUPERIOR */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate("InicioScreen"))}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#000684" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Nuestros Servicios</Text>
          <Text style={styles.headerSubtitle}>Diagnóstico clínico e imagenología</Text>
        </View>

        <TouchableOpacity
          style={styles.headerWhatsAppBtn}
          onPress={handleHeaderWhatsApp}
          activeOpacity={0.7}
        >
          <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* BANNER INFORMATIVO */}
        <View style={styles.heroBanner}>
          <View style={styles.heroBadge}>
            <Ionicons name="shield-checkmark" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.heroBadgeText}>CALIDAD Y PRECISIÓN MÉDICA</Text>
          </View>
          <Text style={styles.heroTitle}>Especialidades y Estudios Clínicos</Text>
          <Text style={styles.heroDesc}>
            Contamos con médicos especialistas certificados, tecnología de punta y entrega de resultados digitales.
          </Text>
        </View>

        {/* BARRA DE BÚSQUEDA */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#8A9BA8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar estudio o especialidad..."
            placeholderTextColor="#8A9BA8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color="#8A9BA8" />
            </TouchableOpacity>
          )}
        </View>

        {/* CHIPS DE CATEGORÍAS */}
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

        {/* CONTEO DE SERVICIOS */}
        <View style={styles.countRow}>
          <Text style={styles.countSectionTitle}>
            {selectedCategory === "Todos" ? "Catálogo de Servicios" : selectedCategory}
          </Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{filteredServices.length} servicios</Text>
          </View>
        </View>

        {/* GRID HOMOGÉNEO DE TARJETAS */}
        <View style={styles.gridContainer}>
          {filteredServices.map((service) => (
            <View key={service.id} style={styles.serviceCard}>
              {/* CONTENEDOR CIRCULAR SUAVE DE LA IMAGEN */}
              <View style={styles.imageWrapper}>
                <Image
                  source={service.image}
                  style={styles.serviceImage}
                  resizeMode="contain"
                />
              </View>

              {/* BADGE DE CATEGORÍA */}
              <View style={styles.cardCategoryBadge}>
                <Text style={styles.cardCategoryBadgeText}>{service.category}</Text>
              </View>

              {/* TÍTULO Y DESCRIPCIÓN */}
              <Text style={styles.cardTitle}>{service.name}</Text>
              <Text style={styles.cardDescription} numberOfLines={2}>
                {service.description}
              </Text>

              {/* BOTONES DE ACCIÓN */}
              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  style={styles.infoButton}
                  onPress={() => handleOpenInfo(service.url)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.infoButtonText}>Más información</Text>
                  <Ionicons name="open-outline" size={13} color="#FFFFFF" style={{ marginLeft: 4 }} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.whatsappCardBtn}
                  onPress={() => handleWhatsAppQuote(service.name)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="logo-whatsapp" size={17} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* FOOTER INFORMATIVO */}
        <View style={styles.footerNote}>
          <Ionicons name="information-circle-outline" size={18} color="#000684" style={{ marginBottom: 4 }} />
          <Text style={styles.footerNoteText}>
            Todos nuestros estudios cumplen con estrictos estándares de bioseguridad, confidencialidad y control de calidad médico.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EBEFF5",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F4FA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000684",
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6B7A8D",
    marginTop: 1,
  },
  headerWhatsAppBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F8EE",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },

  // HERO BANNER
  heroBanner: {
    backgroundColor: "#000684",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000684",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  heroBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  heroDesc: {
    fontSize: 12,
    color: "#DCE6F5",
    lineHeight: 17,
  },

  // BÚSQUEDA
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1A202C",
    padding: 0,
  },

  // CATEGORÍAS
  categoryScroll: {
    paddingBottom: 14,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#DCE3EB",
  },
  categoryChipActive: {
    backgroundColor: "#000684",
    borderColor: "#000684",
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#556575",
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  // CONTEO
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    marginTop: 2,
  },
  countSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0F172A",
  },
  countBadge: {
    backgroundColor: "#E8EDF5",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#000684",
  },

  // GRID DE TARJETAS
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  serviceCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  imageWrapper: {
    width: 95,
    height: 95,
    borderRadius: 48,
    backgroundColor: "#F4F7FB",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 6,
    borderWidth: 1,
    borderColor: "#EDF2F7",
  },
  serviceImage: {
    width: 68,
    height: 68,
  },
  cardCategoryBadge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginVertical: 4,
  },
  cardCategoryBadgeText: {
    color: "#000684",
    fontSize: 10,
    fontWeight: "bold",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0F172A",
    textAlign: "center",
    marginTop: 2,
    marginBottom: 3,
    minHeight: 34,
  },
  cardDescription: {
    fontSize: 11,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 15,
    marginBottom: 10,
    minHeight: 30,
  },

  // BOTONES
  cardActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: "100%",
  },
  infoButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000684",
    paddingVertical: 8,
    borderRadius: 8,
  },
  infoButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  whatsappCardBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#25D366",
    justifyContent: "center",
    alignItems: "center",
  },

  // FOOTER
  footerNote: {
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  footerNoteText: {
    fontSize: 11,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 16,
  },
});

export default AllProducts;

