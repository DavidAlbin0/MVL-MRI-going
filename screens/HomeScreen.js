import React, { useState, useEffect, useRef, useCallback } from "react";
import * as Location from "expo-location";
import {
  Button,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Linking,
  View,
  Modal,
} from "react-native";
import Carousel from "react-native-snap-carousel";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

const data = [
  { id: 1, title: "CheckUps", image: "https://i.imgur.com/jrViBRq.jpeg" },
  { id: 2, title: "Reembolsos", image: "https://i.imgur.com/Zktxl1j.jpeg" },
  { id: 3, title: "Resonancias", image: "https://i.imgur.com/NqSHDQx.png" },
  { id: 4, title: "Tomografías", image: "https://i.imgur.com/2XLVK0I.jpeg" },
];

const SUCURSALES_STATIC = [
  {
    id: "cuernavaca",
    title: "Cuernavaca (Matriz)",
    shortName: "Cuernavaca",
    description: "Av. Cuauhtémoc, Cantarranas",
    address: "Av. Cuauhtémoc #100, Col. Cantarranas, Cuernavaca, Morelos",
    phone: "777 362 0260",
    horario: "Lun a Vie: 7:00 am - 8:00 pm | Sáb: 7:00 am - 3:00 pm",
    badge: "Matriz Principal",
    latlng: { latitude: 18.925978915069365, longitude: -99.22879388097707 },
    pos: { top: "18%", left: "14%" },
  },
  {
    id: "jiutepec",
    title: "Jiutepec (Sucursal)",
    shortName: "Jiutepec",
    description: "Insurgentes, Jiutepec",
    address: "Av. Insurgentes #45, Col. Centro, Jiutepec, Morelos",
    phone: "777 319 7500",
    horario: "Lun a Vie: 7:00 am - 7:00 pm | Sáb: 7:00 am - 2:00 pm",
    badge: "Sucursal Oriente",
    latlng: { latitude: 18.898535, longitude: -99.171207 },
    pos: { top: "36%", left: "42%" },
  },
  {
    id: "cuautla",
    title: "Cuautla (Sucursal)",
    shortName: "Cuautla",
    description: "Centro, Cuautla",
    address: "Calle Batalla 19 de Febrero #30, Centro, Cuautla, Morelos",
    phone: "735 354 5020",
    horario: "Lun a Sáb: 7:00 am - 3:00 pm",
    badge: "Sucursal Cuautla",
    latlng: { latitude: 18.816393, longitude: -98.948435 },
    pos: { top: "42%", right: "10%" },
  },
  {
    id: "jojutla",
    title: "Jojutla (Sucursal)",
    shortName: "Jojutla",
    description: "Centro, Jojutla",
    address: "Calle Zayas Enríquez #202, Col. Centro, Jojutla, Morelos",
    phone: "734 342 8110",
    horario: "Lun a Sáb: 7:00 am - 3:00 pm",
    badge: "Sucursal Sur",
    latlng: { latitude: 18.617170, longitude: -99.192552 },
    pos: { bottom: "16%", left: "28%" },
  },
];

const HomeScreen = () => {
  const carouselRef = useRef(null);
  const [isCarouselSnapping, setCarouselSnapping] = useState(false);
  const navigation = useNavigation();
  const [origin, setOrigin] = useState(null);
  const scrollViewRef = useRef(null);
  const [token, setToken] = useState(null);

  const [selectedBranch, setSelectedBranch] = useState(null); // null = todas
  const [modalSucursales, setModalSucursales] = useState(false);
  const [modalLoginPromo, setModalLoginPromo] = useState(false);
  const [refreshKey, setRefreshKey] = useState(Date.now());

  useEffect(() => {
    setRefreshKey(Date.now());
    setTimeout(() => {
      getLocationPermission();
    }, 100);
  }, []);

  useEffect(() => {
    const getToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        setToken(storedToken);
      } catch (error) {
        console.error("Error al obtener el token:", error);
      }
    };
    getToken();
    const interval = setInterval(getToken, 5000);
    return () => clearInterval(interval);
  }, []);

  const getLocationPermission = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return;
      }
      let location = await Location.getLastKnownPositionAsync({});
      if (!location) {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
        });
      }
      if (location && location.coords) {
        const currentLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setOrigin(currentLocation);
      }
    } catch (error) {
      console.log("Error al obtener ubicación:", error);
    }
  };

  const handleWhatsApp = () => {
    const phoneNumber = "+52 1 777 362 0260";
    const message =
      "¡Hola! Estoy utilizando tu Aplicación Móvil y quiero cotizar un servicio";
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(
      message
    )}`;
    Linking.openURL(url).catch((err) => console.log("Error al abrir WhatsApp:", err));
  };

  const handlePress = () => {
    navigation.navigate("HistorialStudio");
  };

  const handleOpenPromo = () => {
    if (token) {
      navigation.navigate("PromoDesc");
    } else {
      setModalLoginPromo(true);
    }
  };

  const handleScrollToSucursales = () => {
    setModalSucursales(true);
  };

  const handleSelectBranch = (branch) => {
    setSelectedBranch(branch);
    setModalSucursales(false);

    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          y: 620,
          animated: true,
        });
      }
    }, 150);
  };

  const handleNavegarSucursal = (branch) => {
    if (!branch) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${branch.latlng.latitude},${branch.latlng.longitude}`;
    Linking.openURL(url);
  };

  const handleLlamarSucursal = (phone) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone.replace(/\s+/g, "")}`);
  };

  const handleWhatsAppSucursal = (branch) => {
    const phoneNumber = "+52 1 777 362 0260";
    const branchName = branch ? branch.title : "Imagen Médica MRI";
    const message = `¡Hola! Me gustaría cotizar o solicitar informes para la sucursal *${branchName}*.`;
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://wa.me/5217773620260?text=${encodeURIComponent(message)}`);
    });
  };

  const handleSnapToItem = () => {
    if (carouselRef.current && isCarouselSnapping) {
      setTimeout(() => {
        carouselRef.current.snapToItem(0);
        setCarouselSnapping(false);
      }, 5000);
    }
  };

  const _renderItem = ({ item }) => {
    return (
      <SafeAreaView>
        <Image
          source={{ uri: `${item.image}?${refreshKey}` }}
          style={{
            height: Dimensions.get("window").width * 0.65,
            width: Dimensions.get("window").width,
            resizeMode: "cover",
          }}
        />
      </SafeAreaView>
    );
  };

  return (
    <SafeAreaView style={styles.colordelfondo}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView ref={scrollViewRef}>
          {/* Header Logo ALIGNED LEFT */}
          <SafeAreaView style={styles.container}>
            <Image
              source={require("../assets/logos/logoph.png")}
              style={styles.mid}
            />
          </SafeAreaView>

          {/* Carousel */}
          <SafeAreaView style={styles.backg}>
            <Carousel
              ref={carouselRef}
              data={data}
              renderItem={_renderItem}
              sliderWidth={Dimensions.get("window").width}
              itemWidth={Dimensions.get("window").width}
              autoplay={true}
              autoplayInterval={4000}
              lockScrollWhileSnapping={true}
              onSnapToItem={handleSnapToItem}
            />
          </SafeAreaView>

          {/* Compact Green WhatsApp Button */}
          <View style={styles.whaty}>
            <TouchableOpacity style={styles.botonwhat} onPress={handleWhatsApp}>
              <View style={styles.whatsappContainer}>
                <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.subtitulowhats}>
                  ¿Necesitas Cotizar? Cotiza vía WhatsApp
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Bienvenido Section */}
          <SafeAreaView style={{ marginTop: 5 }}>
            <SafeAreaView style={styles.tituloBienvenido}>
              <Text style={styles.subtitulo1}>¡BIENVENIDO!</Text>
            </SafeAreaView>

            <SafeAreaView style={styles.flexIcon}>
              <TouchableOpacity
                style={styles.imageContainer}
                onPress={handleScrollToSucursales}
              >
                <Image
                  source={require("../assets/iconos/Ubicaciones.png")}
                  style={styles.imageNav}
                />
                <Text style={{ marginTop: 6, fontWeight: "600", color: "#333" }}>Sucursales</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.imageContainer}
                onPress={() => navigation.navigate("AllProducts")}
              >
                <Image
                  source={require("../assets/iconos/Estetoscopio.png")}
                  style={styles.imageNav}
                />
                <Text style={{ marginTop: 6, fontWeight: "600", color: "#333" }}>Servicios</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.imageContainer}
                onPress={handlePress}
              >
                <Image
                  source={require("../assets/iconos/Agenda.png")}
                  style={styles.imageNav}
                />
                <Text style={{ marginTop: 6, fontWeight: "600", color: "#333" }}>Resultados</Text>
              </TouchableOpacity>
            </SafeAreaView>

            {/* Banner de Promociones y Descuentos */}
            <TouchableOpacity
              style={styles.promoBannerHome}
              onPress={handleOpenPromo}
              activeOpacity={0.88}
            >
              <View style={styles.promoBannerLeft}>
                <View style={styles.promoTagHome}>
                  <Ionicons name="flame" size={12} color="#FFF" style={{ marginRight: 4 }} />
                  <Text style={styles.promoTagHomeText}>OFERTAS Y CUPONES</Text>
                </View>
                <Text style={styles.promoTitleHome}>Promociones y Descuentos</Text>
                <Text style={styles.promoSubHome}>Hasta 30% OFF en Resonancias, Check-ups y más →</Text>
              </View>
              <View style={styles.promoIconRight}>
                <Ionicons name="pricetag" size={24} color="#000684" />
              </View>
            </TouchableOpacity>
          </SafeAreaView>

          {/* Sucursales & Map */}
          <SafeAreaView style={styles.contaComp}>
            <SafeAreaView style={styles.tituloBanner}>
              <Text style={styles.subtitulo11}>
                ¿NO CONOCES TU SUCURSAL MÁS CERCANA?
              </Text>
              <Text style={styles.subtitulo2}>
                {selectedBranch ? `Mostrando: ${selectedBranch.title}` : "Encuéntrala aquí"}
              </Text>
            </SafeAreaView>

            {/* Chips selector de sucursales en el mapa */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.branchChipsScroll}
            >
              <TouchableOpacity
                style={[styles.branchChip, selectedBranch === null && styles.branchChipActive]}
                onPress={() => handleSelectBranch(null)}
                activeOpacity={0.75}
              >
                <Text style={[styles.branchChipText, selectedBranch === null && styles.branchChipTextActive]}>
                  Todas (4)
                </Text>
              </TouchableOpacity>
              {SUCURSALES_STATIC.map((sucursal) => {
                const isSelected = selectedBranch?.id === sucursal.id;
                return (
                  <TouchableOpacity
                    key={sucursal.id}
                    style={[styles.branchChip, isSelected && styles.branchChipActive]}
                    onPress={() => handleSelectBranch(sucursal)}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name="location"
                      size={13}
                      color={isSelected ? "#FFFFFF" : "#000684"}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.branchChipText, isSelected && styles.branchChipTextActive]}>
                      {sucursal.shortName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* MAPA DE PRUEBA INTERACTIVO */}
            <View style={styles.testMapCard}>
              {/* Barra superior de estado del mapa demo */}
              <View style={styles.testMapTopBar}>
                <View style={styles.testMapBadge}>
                  <View style={styles.testMapBadgeDot} />
                  <Text style={styles.testMapBadgeText}>MAPA DE PRUEBA · SUCURSALES MORELOS</Text>
                </View>
                {selectedBranch ? (
                  <TouchableOpacity
                    style={styles.testMapResetBtn}
                    onPress={() => handleSelectBranch(null)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="refresh-outline" size={12} color="#000684" style={{ marginRight: 3 }} />
                    <Text style={styles.testMapResetText}>Ver todas</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.testMapHint}>Toca un pin para explorar</Text>
                )}
              </View>

              {/* Canvas visual estilizado del mapa */}
              <View style={styles.testMapCanvas}>
                {/* Cuadrícula sutil de fondo */}
                <View style={styles.mapGridLine1} />
                <View style={styles.mapGridLine2} />
                <View style={styles.mapGridLine3} />

                {/* Zona norte montañosa */}
                <View style={styles.mapZoneNorth}>
                  <Text style={styles.mapZoneLabel}>SIERRA DE TEPOZTLÁN / PARQUE NACIONAL</Text>
                </View>

                {/* Autopista México - Acapulco (Autopista del Sol) */}
                <View style={styles.mapRoadFederal}>
                  <Text style={styles.mapRoadLabelVert}>AUTOPISTA DEL SOL (95D)</Text>
                </View>

                {/* Carretera Cuernavaca - Jiutepec - Cuautla */}
                <View style={styles.mapRoadCuautla}>
                  <Text style={styles.mapRoadLabelHoriz}>CARR. CUERNAVACA - CUAUTLA</Text>
                </View>

                {/* Zona Lago Tequesquitengo / Jojutla */}
                <View style={styles.mapZoneLake}>
                  <Text style={styles.mapLakeLabel}>LAGO TEQUESQUITENGO</Text>
                </View>

                {/* Pines interactivos de las 4 sucursales */}
                {SUCURSALES_STATIC.map((sucursal) => {
                  const isSelected = selectedBranch?.id === sucursal.id;
                  return (
                    <TouchableOpacity
                      key={sucursal.id}
                      style={[
                        styles.testPinWrapper,
                        sucursal.pos,
                        isSelected && styles.testPinWrapperActive,
                      ]}
                      onPress={() => handleSelectBranch(isSelected ? null : sucursal)}
                      activeOpacity={0.8}
                    >
                      {/* Callout si está seleccionada */}
                      {isSelected && (
                        <View style={styles.testPinCallout}>
                          <Text style={styles.testPinCalloutTitle}>{sucursal.shortName}</Text>
                          <Text style={styles.testPinCalloutSub}>{sucursal.badge}</Text>
                        </View>
                      )}

                      {/* Botón pin circular */}
                      <View style={[styles.testPinBubble, isSelected && styles.testPinBubbleActive]}>
                        <Ionicons
                          name="business"
                          size={isSelected ? 17 : 14}
                          color={isSelected ? "#FFFFFF" : "#000684"}
                        />
                      </View>

                      {/* Etiqueta de la sucursal */}
                      <View style={[styles.testPinLabelBox, isSelected && styles.testPinLabelBoxActive]}>
                        <Text style={[styles.testPinLabelText, isSelected && styles.testPinLabelTextActive]}>
                          {sucursal.shortName}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {/* Botón flotante inferior para abrir Google Maps oficial */}
                <TouchableOpacity
                  style={styles.testMapGpsButton}
                  onPress={() => {
                    const target = selectedBranch || SUCURSALES_STATIC[0];
                    handleNavegarSucursal(target);
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="navigate-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.testMapGpsText}>
                    {selectedBranch
                      ? `Abrir ${selectedBranch.shortName} en Google Maps`
                      : "Abrir Matriz en Google Maps"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Tarjeta de información de la sucursal seleccionada */}
            {selectedBranch && (
              <View style={styles.branchCard}>
                <View style={styles.branchCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.branchCardTitle}>{selectedBranch.title}</Text>
                    <View style={styles.branchBadgeRow}>
                      <View style={styles.branchBadge}>
                        <Text style={styles.branchBadgeText}>{selectedBranch.badge}</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.branchCloseSelect}
                    onPress={() => handleSelectBranch(null)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.branchCloseSelectText}>Ver todas</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.branchInfoRow}>
                  <Ionicons name="location-outline" size={17} color="#000684" style={{ marginRight: 8, marginTop: 1 }} />
                  <Text style={styles.branchInfoText}>{selectedBranch.address}</Text>
                </View>

                <View style={styles.branchInfoRow}>
                  <Ionicons name="time-outline" size={17} color="#000684" style={{ marginRight: 8, marginTop: 1 }} />
                  <Text style={styles.branchInfoText}>{selectedBranch.horario}</Text>
                </View>

                <View style={styles.branchInfoRow}>
                  <Ionicons name="call-outline" size={17} color="#000684" style={{ marginRight: 8, marginTop: 1 }} />
                  <Text style={styles.branchInfoText}>{selectedBranch.phone}</Text>
                </View>

                {/* Botones de acción rápida */}
                <View style={styles.branchActionsRow}>
                  <TouchableOpacity
                    style={styles.btnNavigate}
                    onPress={() => handleNavegarSucursal(selectedBranch)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="navigate" size={14} color="#FFFFFF" style={{ marginRight: 5 }} />
                    <Text style={styles.btnNavigateText}>Cómo Llegar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnCall}
                    onPress={() => handleLlamarSucursal(selectedBranch.phone)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="call" size={14} color="#000684" style={{ marginRight: 5 }} />
                    <Text style={styles.btnCallText}>Llamar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnBranchWhatsApp}
                    onPress={() => handleWhatsAppSucursal(selectedBranch)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Prompt cuando no hay sucursal seleccionada */}
            {!selectedBranch && (
              <View style={styles.branchEmptyPrompt}>
                <Ionicons name="information-circle-outline" size={20} color="#000684" style={{ marginRight: 8, marginTop: 1 }} />
                <Text style={styles.branchEmptyPromptText}>
                  Toca una sucursal en el mapa de prueba o en los botones para consultar horarios, teléfono y cómo llegar.
                </Text>
              </View>
            )}

            <Text style={styles.calidadCalid}>
              Calidad y calidez, para tu salud{" "}
            </Text>
          </SafeAreaView>
        </ScrollView>

        {/* MODAL SELECTOR DE SUCURSALES */}
        <Modal
          visible={modalSucursales}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setModalSucursales(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSucursalContent}>
              <View style={styles.modalSucursalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalSucursalTitle}>Nuestras Sucursales</Text>
                  <Text style={styles.modalSucursalSub}>
                    Selecciona una para ver su ubicación en el mapa
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setModalSucursales(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                {SUCURSALES_STATIC.map((sucursal) => {
                  const isSelected = selectedBranch?.id === sucursal.id;
                  return (
                    <TouchableOpacity
                      key={sucursal.id}
                      style={[styles.sucursalModalItem, isSelected && styles.sucursalModalItemActive]}
                      onPress={() => handleSelectBranch(sucursal)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.sucursalItemIconBox}>
                        <Ionicons name="location" size={22} color="#000684" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Text style={styles.sucursalItemTitle}>{sucursal.title}</Text>
                          <View style={styles.sucursalItemBadge}>
                            <Text style={styles.sucursalItemBadgeText}>{sucursal.badge}</Text>
                          </View>
                        </View>
                        <Text style={styles.sucursalItemAddress} numberOfLines={2}>
                          {sucursal.address}
                        </Text>
                        <Text style={styles.sucursalItemHours}>
                          🕒 {sucursal.horario}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#000684" />
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={styles.btnVerTodasModal}
                  onPress={() => handleSelectBranch(null)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="map-outline" size={18} color="#000684" style={{ marginRight: 8 }} />
                  <Text style={styles.btnVerTodasModalText}>Ver todas las sucursales en el mapa</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* MODAL INICIO DE SESIÓN REQUERIDO PARA PROMOCIONES */}
        <Modal
          visible={modalLoginPromo}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setModalLoginPromo(false)}
        >
          <View style={styles.modalCenterOverlay}>
            <View style={styles.promoModalBox}>
              <View style={styles.promoModalIconCircle}>
                <Ionicons name="pricetag" size={30} color="#000684" />
              </View>
              <Text style={styles.promoModalTitle}>Inicia Sesión Requerido</Text>
              <Text style={styles.promoModalDesc}>
                Para consultar las promociones, cupones y descuentos exclusivos de Imagen Médica MRI, es necesario que inicies sesión con tu cuenta de paciente.
              </Text>

              <TouchableOpacity
                style={styles.promoModalBtnLogin}
                onPress={() => {
                  setModalLoginPromo(false);
                  navigation.navigate("Configuracion");
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="log-in-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.promoModalBtnLoginText}>Iniciar Sesión</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.promoModalBtnCancel}
                onPress={() => setModalLoginPromo(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.promoModalBtnCancelText}>Continuar explorando</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    height: 65,
    marginTop: 35,
    marginBottom: 5,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  colordelfondo: {
    backgroundColor: "#ffffff",
    flex: 1,
  },
  mid: {
    height: 60,
    width: 120,
    marginStart: 15,
    resizeMode: "contain",
  },
  tituloBienvenido: {
    backgroundColor: "#000684",
    minHeight: 48,
    marginHorizontal: 25,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tituloBanner: {
    backgroundColor: "#000684",
    minHeight: 60,
    marginHorizontal: 25,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backg: {
    backgroundColor: "#ffffff",
  },
  // ESTILOS MAPA DE PRUEBA INTERACTIVO
  testMapCard: {
    width: "92%",
    alignSelf: "center",
    marginTop: 15,
    marginBottom: 8,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBDCF0",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    overflow: "hidden",
  },
  testMapTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  testMapBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  testMapBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  testMapBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#000684",
    letterSpacing: 0.5,
  },
  testMapResetBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBDCF0",
  },
  testMapResetText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#000684",
  },
  testMapHint: {
    fontSize: 11,
    color: "#64748B",
  },
  testMapCanvas: {
    height: 330,
    width: "100%",
    backgroundColor: "#EBF3FC",
    position: "relative",
    overflow: "hidden",
  },
  mapGridLine1: {
    position: "absolute",
    top: "33%",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(203, 220, 240, 0.45)",
  },
  mapGridLine2: {
    position: "absolute",
    top: "66%",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(203, 220, 240, 0.45)",
  },
  mapGridLine3: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "50%",
    width: 1,
    backgroundColor: "rgba(203, 220, 240, 0.45)",
  },
  mapZoneNorth: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 38,
    backgroundColor: "#DCFCE7",
    opacity: 0.7,
    justifyContent: "center",
    alignItems: "center",
  },
  mapZoneLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#166534",
    letterSpacing: 1.2,
  },
  mapRoadFederal: {
    position: "absolute",
    top: 38,
    bottom: 0,
    left: "26%",
    width: 8,
    backgroundColor: "#CBD5E1",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#94A3B8",
    justifyContent: "center",
    alignItems: "center",
  },
  mapRoadLabelVert: {
    fontSize: 6,
    color: "#64748B",
    fontWeight: "bold",
    letterSpacing: 1,
    transform: [{ rotate: "90deg" }],
    width: 160,
    textAlign: "center",
  },
  mapRoadCuautla: {
    position: "absolute",
    top: "40%",
    left: "26%",
    right: "8%",
    height: 7,
    backgroundColor: "#CBD5E1",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#94A3B8",
    justifyContent: "center",
  },
  mapRoadLabelHoriz: {
    fontSize: 6,
    color: "#64748B",
    fontWeight: "bold",
    letterSpacing: 1,
    textAlign: "center",
  },
  mapZoneLake: {
    position: "absolute",
    bottom: 12,
    right: "16%",
    width: 90,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#BFDBFE",
    opacity: 0.65,
    justifyContent: "center",
    alignItems: "center",
  },
  mapLakeLabel: {
    fontSize: 8,
    color: "#1E40AF",
    fontWeight: "bold",
  },
  testPinWrapper: {
    position: "absolute",
    alignItems: "center",
    zIndex: 10,
  },
  testPinWrapperActive: {
    zIndex: 30,
  },
  testPinCallout: {
    backgroundColor: "#000684",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  testPinCalloutTitle: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  testPinCalloutSub: {
    color: "#93C5FD",
    fontSize: 8,
  },
  testPinBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#000684",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  testPinBubbleActive: {
    backgroundColor: "#000684",
    borderColor: "#FFD700",
    width: 38,
    height: 38,
    borderRadius: 19,
    transform: [{ scale: 1.08 }],
  },
  testPinLabelBox: {
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  testPinLabelBoxActive: {
    backgroundColor: "#000684",
    borderColor: "#000684",
  },
  testPinLabelText: {
    fontSize: 9,
    fontWeight: "600",
    color: "#1E293B",
  },
  testPinLabelTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  testMapGpsButton: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000684",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 40,
  },
  testMapGpsText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },

  // PROMPT CUANDO NO HAY SUCURSAL
  branchEmptyPrompt: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F4FA",
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D2E0F2",
  },
  branchEmptyPromptText: {
    flex: 1,
    fontSize: 12,
    color: "#4A5568",
    lineHeight: 17,
  },
  subtitulo1: {
    textAlign: "center",
    textTransform: "uppercase",
    fontSize: 18,
    color: "#ffffff",
    fontWeight: "bold",
    letterSpacing: 1,
  },
  subtitulo11: {
    textAlign: "center",
    textTransform: "uppercase",
    fontSize: 13,
    color: "#ffffff",
    fontWeight: "bold",
    lineHeight: 18,
  },
  subtitulo2: {
    textAlign: "center",
    fontSize: 13,
    color: "#E0E0E0",
    marginTop: 3,
  },
  whaty: {
    marginVertical: 12,
    alignItems: "center",
  },
  botonwhat: {
    backgroundColor: "#25D366",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  whatsappContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  subtitulowhats: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 13,
  },
  flexIcon: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#ffffff",
    marginTop: 25,
    marginBottom: 10,
  },
  imageContainer: {
    flex: 1,
    alignItems: "center",
  },
  imageNav: {
    height: 70,
    width: 70,
    resizeMode: "contain",
  },
  calidadCalid: {
    textAlign: "center",
    fontSize: 15,
    color: "#0056BD",
    fontWeight: "600",
    marginTop: 15,
    marginBottom: 25,
  },
  contaComp: {
    marginTop: 20,
  },
  promoBannerHome: {
    marginHorizontal: 16,
    marginTop: 15,
    marginBottom: 5,
    padding: 14,
    backgroundColor: "#F0F4FA",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D2E0F2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000684",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  promoBannerLeft: {
    flex: 1,
    paddingRight: 10,
  },
  promoTagHome: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#FF3B30",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    marginBottom: 4,
  },
  promoTagHomeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  promoTitleHome: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#000684",
  },
  promoSubHome: {
    fontSize: 12,
    color: "#4A5568",
    marginTop: 2,
  },
  promoIconRight: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D2E0F2",
  },

  // CHIPS SELECTOR DE SUCURSALES
  branchChipsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
  },
  branchChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F4FA",
    borderWidth: 1,
    borderColor: "#CBDCF0",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
  },
  branchChipActive: {
    backgroundColor: "#000684",
    borderColor: "#000684",
  },
  branchChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000684",
  },
  branchChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  // TARJETA DE SUCURSAL SELECCIONADA
  branchCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  branchCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  branchCardTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#0F172A",
  },
  branchBadgeRow: {
    marginTop: 3,
  },
  branchBadge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  branchBadgeText: {
    fontSize: 11,
    color: "#000684",
    fontWeight: "600",
  },
  branchCloseSelect: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  branchCloseSelectText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  branchInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  branchInfoText: {
    flex: 1,
    fontSize: 12,
    color: "#334155",
    lineHeight: 18,
  },
  branchActionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  btnNavigate: {
    flex: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000684",
    paddingVertical: 9,
    borderRadius: 8,
  },
  btnNavigateText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  btnCall: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F4FA",
    borderWidth: 1,
    borderColor: "#CBDCF0",
    paddingVertical: 9,
    borderRadius: 8,
  },
  btnCallText: {
    color: "#000684",
    fontSize: 12,
    fontWeight: "600",
  },
  btnBranchWhatsApp: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: "#25D366",
    justifyContent: "center",
    alignItems: "center",
  },

  // MODAL SUCURSALES
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalSucursalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 28,
    maxHeight: "85%",
  },
  modalSucursalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalSucursalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000684",
  },
  modalSucursalSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  sucursalModalItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  sucursalModalItemActive: {
    borderColor: "#000684",
    backgroundColor: "#EEF2FF",
  },
  sucursalItemIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sucursalItemTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0F172A",
    marginRight: 6,
  },
  sucursalItemBadge: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  sucursalItemBadgeText: {
    fontSize: 10,
    color: "#475569",
    fontWeight: "600",
  },
  sucursalItemAddress: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    lineHeight: 16,
  },
  sucursalItemHours: {
    fontSize: 11,
    color: "#000684",
    marginTop: 3,
  },
  btnVerTodasModal: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#F0F4FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBDCF0",
    marginTop: 6,
  },
  btnVerTodasModalText: {
    color: "#000684",
    fontSize: 13,
    fontWeight: "bold",
  },

  // MODAL PROMO LOGIN
  modalCenterOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  promoModalBox: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  promoModalIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  promoModalTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 8,
  },
  promoModalDesc: {
    fontSize: 13,
    color: "#475569",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20,
  },
  promoModalBtnLogin: {
    backgroundColor: "#000684",
    width: "100%",
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  promoModalBtnLoginText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  promoModalBtnCancel: {
    paddingVertical: 10,
    width: "100%",
    alignItems: "center",
  },
  promoModalBtnCancelText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "500",
  },
});

export default HomeScreen;
