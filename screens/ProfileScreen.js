import React, { useState, useEffect, Fragment, useCallback } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator,
  Linking,
  StatusBar,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { gql, useLazyQuery } from "@apollo/client";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import base64 from "base-64";

const OBTENER_COMPRAS = gql`
  query obtenerComprasPorCurp($curp: String!) {
    obtenerComprasPorCurp(curp: $curp) {
      id
      curp
      producto
      precio
      fechaCompra
      estatus
      folio
      monederoUsado
    }
  }
`;

const OBTENER_MONEDERO = gql`
  query obtenerMonederoPorCurp($curp: String!) {
    obtenerMonederoPorCurp(curp: $curp) {
      curp
      saldoPuntos
      saldoPesos
    }
  }
`;

const parseJwt = (tokenStr) => {
  try {
    const base64Url = tokenStr.split(".")[1];
    const base64String = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      base64
        .decode(base64String)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    try {
      return JSON.parse(base64.decode(tokenStr.split(".")[1]));
    } catch (err) {
      return null;
    }
  }
};

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [token, setToken] = useState(null);
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [curpUsuario, setCurpUsuario] = useState("");
  const [modalCompras, setModalCompras] = useState(false);
  const [modalMonedero, setModalMonedero] = useState(false);

  const [getCompras, { loading: loadingCompras, data: dataCompras }] = useLazyQuery(OBTENER_COMPRAS, {
    fetchPolicy: "network-only",
  });
  const [getMonedero, { loading: loadingMonedero, data: dataMonedero }] = useLazyQuery(OBTENER_MONEDERO, {
    fetchPolicy: "network-only",
  });

  const getToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      setToken(storedToken);
      if (storedToken) {
        const decoded = parseJwt(storedToken);
        if (decoded) {
          setNombreUsuario(decoded.nombre || decoded.username || "Paciente");
          setCurpUsuario(decoded.curp || "");
          if (decoded.curp) {
            getMonedero({ variables: { curp: decoded.curp } });
          }
        }
      } else {
        setNombreUsuario("");
        setCurpUsuario("");
      }
    } catch (error) {
      console.log("Error al obtener token:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getToken();
    }, [])
  );

  const abrirMisCompras = () => {
    if (curpUsuario) {
      getCompras({ variables: { curp: curpUsuario } });
    }
    setModalCompras(true);
  };

  const abrirMonedero = () => {
    if (curpUsuario) {
      getMonedero({ variables: { curp: curpUsuario } });
    }
    setModalMonedero(true);
  };

  const handleWhatsApp = () => {
    const phoneNumber = "+52 1 777 362 0260";
    const message = "¡Hola! Estoy utilizando la aplicación móvil de Imagen Médica MRI y quiero cotizar un servicio.";
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://wa.me/5217773620260?text=${encodeURIComponent(message)}`);
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={token ? "light-content" : "dark-content"} backgroundColor={token ? "#000684" : "#FFFFFF"} />

      {/* MODAL MIS COMPRAS */}
      <Modal visible={modalCompras} transparent animationType="slide" onRequestClose={() => setModalCompras(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardLarge}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={[styles.modalIconBadge, { backgroundColor: "#EEF2FF" }]}>
                  <Ionicons name="bag-check" size={22} color="#000684" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Mis Compras</Text>
                  <Text style={styles.modalSubtitle}>Historial de órdenes y pagos</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setModalCompras(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={26} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {loadingCompras ? (
              <ActivityIndicator size="large" color="#000684" style={{ marginVertical: 36 }} />
            ) : dataCompras && dataCompras.obtenerComprasPorCurp && dataCompras.obtenerComprasPorCurp.length > 0 ? (
              <FlatList
                data={dataCompras.obtenerComprasPorCurp}
                keyExtractor={(item, idx) => item.id || idx.toString()}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={styles.cardItemCompra}>
                    <View style={styles.compraHeaderRow}>
                      <Text style={styles.folioText}>Folio: {item.folio || "MRI-ORD-000"}</Text>
                      <View style={styles.badgeEstatus}>
                        <Text style={styles.badgeEstatusText}>{item.estatus || "Completado"}</Text>
                      </View>
                    </View>
                    <Text style={styles.compraProductoTitle}>{item.producto}</Text>
                    <View style={styles.compraFooterRow}>
                      <Text style={styles.compraFechaText}>📅 {item.fechaCompra || "Reciente"}</Text>
                      <Text style={styles.compraPrecioText}>${item.precio}</Text>
                    </View>
                  </View>
                )}
                style={{ width: "100%", maxHeight: 380 }}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="cart-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>Aún no tienes compras</Text>
                <Text style={styles.emptyText}>Tus estudios adquiridos en la tienda digital aparecerán aquí.</Text>
              </View>
            )}

            <TouchableOpacity style={styles.btnCerrarModal} onPress={() => setModalCompras(false)}>
              <Text style={styles.btnCerrarText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL MONEDERO ELECTRÓNICO */}
      <Modal visible={modalMonedero} transparent animationType="fade" onRequestClose={() => setModalMonedero(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardLarge}>
            <View style={styles.modalIconBoxBig}>
              <MaterialIcons name="account-balance-wallet" size={44} color="#137333" />
            </View>
            <Text style={styles.modalTitleCenter}>Monedero Electrónico MRI</Text>
            <Text style={styles.modalSubCenter}>Beneficios exclusivos de lealtad médica</Text>

            <View style={styles.monederoCardBox}>
              <Text style={styles.monederoPuntosLabel}>PUNTOS ACUMULADOS</Text>
              <Text style={styles.monederoPuntosValue}>
                {dataMonedero?.obtenerMonederoPorCurp?.saldoPuntos || 150} pts
              </Text>

              <View style={styles.monederoDivider} />

              <Text style={styles.monederoPesosLabel}>SALDO DISPONIBLE EN DINERO</Text>
              <Text style={styles.monederoPesosValue}>
                {dataMonedero?.obtenerMonederoPorCurp?.saldoPesos || "$375.00 MXN"}
              </Text>
            </View>

            <View style={styles.monederoTip}>
              <Ionicons name="bulb-outline" size={18} color="#0056BD" style={{ marginRight: 8, marginTop: 1 }} />
              <Text style={styles.monederoTipText}>
                Acumula el 5% en Puntos MRI en cada estudio y utilízalo para pagar o aplicar descuentos en tus próximas consultas.
              </Text>
            </View>

            <TouchableOpacity style={styles.btnCerrarModal} onPress={() => setModalMonedero(false)}>
              <Text style={styles.btnCerrarText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }}>
        {token ? (
          <Fragment>
            {/* ENCABEZADO PERFIL */}
            <View style={styles.profileHeader}>
              <View style={styles.profileHeaderTop}>
                <Image
                  source={require("../assets/logos/logoph.png")}
                  style={styles.headerLogo}
                  resizeMode="contain"
                />
                <View style={styles.onlineBadge}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineBadgeText}>En Línea</Text>
                </View>
              </View>

              <View style={styles.userInfoRow}>
                <View style={styles.userAvatarBox}>
                  <Ionicons name="person" size={32} color="#000684" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.greetingText}>¡Hola de nuevo!</Text>
                  <Text style={styles.userNameText}>{nombreUsuario}</Text>
                  <Text style={styles.userCurpText}>{curpUsuario ? `CURP: ${curpUsuario}` : "Paciente Verificado"}</Text>
                </View>
              </View>
            </View>

            {/* WIDGET RÁPIDO DE MONEDERO */}
            <TouchableOpacity style={styles.walletWidgetCard} onPress={abrirMonedero} activeOpacity={0.85}>
              <View style={styles.walletWidgetLeft}>
                <View style={styles.walletIconCircle}>
                  <Ionicons name="wallet" size={24} color="#137333" />
                </View>
                <View>
                  <Text style={styles.walletWidgetLabel}>Monedero Electrónico</Text>
                  <Text style={styles.walletWidgetAmount}>
                    {dataMonedero?.obtenerMonederoPorCurp?.saldoPesos || "$375.00 MXN"}
                  </Text>
                </View>
              </View>
              <View style={styles.walletWidgetBtn}>
                <Text style={styles.walletWidgetBtnText}>Ver saldo</Text>
                <Ionicons name="chevron-forward" size={14} color="#137333" />
              </View>
            </TouchableOpacity>

            {/* GRUPO 1: MIS ESTUDIOS Y ACTIVIDAD */}
            <Text style={styles.groupHeading}>ACTIVIDAD Y ESTUDIOS</Text>
            <View style={styles.cardGroup}>
              <TouchableOpacity style={styles.optionRow} onPress={abrirMisCompras} activeOpacity={0.7}>
                <View style={[styles.iconBox, { backgroundColor: "#EEF2FF" }]}>
                  <Ionicons name="bag-check-outline" size={22} color="#000684" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Mis Compras</Text>
                  <Text style={styles.optionSub}>Órdenes y paquetes adquiridos</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>

              <View style={styles.groupSeparator} />

              <TouchableOpacity style={styles.optionRow} onPress={abrirMonedero} activeOpacity={0.7}>
                <View style={[styles.iconBox, { backgroundColor: "#E8F8EE" }]}>
                  <Ionicons name="wallet-outline" size={22} color="#137333" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Monedero Electrónico MRI</Text>
                  <Text style={styles.optionSub}>Puntos y saldo acumulable para pagar</Text>
                </View>
                <View style={styles.walletBadgeMini}>
                  <Text style={styles.walletBadgeMiniText}>ACTIVO</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>

              <View style={styles.groupSeparator} />

              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => navigation.navigate("HistorialStudio")}
                activeOpacity={0.7}
              >
                <View style={[styles.iconBox, { backgroundColor: "#F0F9FF" }]}>
                  <Ionicons name="document-text-outline" size={22} color="#0284C7" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Historial de Estudios</Text>
                  <Text style={styles.optionSub}>Resultados, reportes y archivos descargables</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* GRUPO 2: BENEFICIOS Y CUENTA */}
            <Text style={styles.groupHeading}>BENEFICIOS Y CUENTA</Text>
            <View style={styles.cardGroup}>
              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => navigation.navigate("PromoDesc")}
                activeOpacity={0.7}
              >
                <View style={[styles.iconBox, { backgroundColor: "#FEF2F2" }]}>
                  <Ionicons name="pricetag-outline" size={22} color="#DC2626" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Promociones y Descuentos</Text>
                  <Text style={styles.optionSub}>Cupones digitales y tarifas especiales</Text>
                </View>
                <View style={styles.hotBadge}>
                  <Text style={styles.hotBadgeText}>HOT</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>

              <View style={styles.groupSeparator} />

              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => navigation.navigate("Datos Personales")}
                activeOpacity={0.7}
              >
                <View style={[styles.iconBox, { backgroundColor: "#F5F3FF" }]}>
                  <Ionicons name="person-outline" size={22} color="#7C3AED" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Datos de la Cuenta</Text>
                  <Text style={styles.optionSub}>Información personal y de contacto</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* GRUPO 3: ATENCIÓN AL PACIENTE */}
            <Text style={styles.groupHeading}>ATENCIÓN Y CONTACTO</Text>
            <View style={styles.cardGroup}>
              <TouchableOpacity style={styles.optionRow} onPress={handleWhatsApp} activeOpacity={0.7}>
                <View style={[styles.iconBox, { backgroundColor: "#E8F8EE" }]}>
                  <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>¿Necesitas Cotizar?</Text>
                  <Text style={styles.optionSub}>Asistencia directa por WhatsApp</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>

              <View style={styles.groupSeparator} />

              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => Linking.openURL("https://www.mrimagenmedica.com.mx/sobre-nosotros/")}
                activeOpacity={0.7}
              >
                <View style={[styles.iconBox, { backgroundColor: "#F1F5F9" }]}>
                  <Ionicons name="information-circle-outline" size={22} color="#475569" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Sobre Nosotros</Text>
                  <Text style={styles.optionSub}>Conoce la red de clínicas Imagen Médica MRI</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </Fragment>
        ) : (
          /* VISTA INVITADO / SIN SESIÓN */
          <View style={styles.guestContainer}>
            <View style={styles.guestIconCircle}>
              <Ionicons name="person-circle-outline" size={72} color="#000684" />
            </View>

            <View style={styles.guestBadge}>
              <Ionicons name="shield-checkmark" size={12} color="#000684" style={{ marginRight: 4 }} />
              <Text style={styles.guestBadgeText}>PORTAL DE PACIENTES</Text>
            </View>

            <Text style={styles.guestTitle}>Accede a tu Perfil Médico</Text>
            <Text style={styles.guestSub}>
              Inicia sesión para descargar tus resultados de laboratorio, consultar tu monedero y gestionar tus citas.
            </Text>

            {/* BENEFICIOS DEL PACIENTE */}
            <View style={styles.guestFeaturesCard}>
              <View style={styles.guestFeatureRow}>
                <Ionicons name="checkmark-circle" size={18} color="#137333" style={{ marginRight: 10 }} />
                <Text style={styles.guestFeatureText}>Historial de estudios y reportes descargables</Text>
              </View>
              <View style={styles.guestFeatureRow}>
                <Ionicons name="checkmark-circle" size={18} color="#137333" style={{ marginRight: 10 }} />
                <Text style={styles.guestFeatureText}>Monedero electrónico con puntos y descuentos</Text>
              </View>
              <View style={styles.guestFeatureRow}>
                <Ionicons name="checkmark-circle" size={18} color="#137333" style={{ marginRight: 10 }} />
                <Text style={styles.guestFeatureText}>Seguimiento de compras y órdenes médicas</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.btnGuestLogin}
              onPress={() => navigation.navigate("Configuracion")}
              activeOpacity={0.85}
            >
              <Ionicons name="log-in-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.btnGuestLoginText}>Iniciar Sesión</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnGuestRegister}
              onPress={() => navigation.navigate("CrearCuenta")}
              activeOpacity={0.8}
            >
              <Text style={styles.btnGuestRegisterText}>Crear una Cuenta Nueva</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },

  // HEADER LOGUEADO
  profileHeader: {
    backgroundColor: "#000684",
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  profileHeaderTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerLogo: {
    width: 120,
    height: 48,
  },
  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#25D366",
    marginRight: 6,
  },
  onlineBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatarBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  greetingText: {
    fontSize: 13,
    color: "#DCE4F0",
  },
  userNameText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginVertical: 2,
  },
  userCurpText: {
    fontSize: 12,
    color: "#CBD5E1",
  },

  // WIDGET MONEDERO
  walletWidgetCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: -14,
    marginBottom: 16,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#CBE7D3",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  walletWidgetLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  walletIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E8F8EE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  walletWidgetLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  walletWidgetAmount: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#137333",
    marginTop: 1,
  },
  walletWidgetBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F8EE",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  walletWidgetBtnText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#137333",
    marginRight: 2,
  },

  // GRUPOS DE OPCIONES
  groupHeading: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#64748B",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 10,
    marginLeft: 20,
  },
  cardGroup: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  optionContent: {
    flex: 1,
    marginRight: 8,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 2,
  },
  optionSub: {
    fontSize: 12,
    color: "#64748B",
  },
  groupSeparator: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginLeft: 72,
  },
  hotBadge: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 6,
  },
  hotBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  walletBadgeMini: {
    backgroundColor: "#E8F8EE",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  walletBadgeMiniText: {
    color: "#137333",
    fontSize: 10,
    fontWeight: "bold",
  },

  // ESTILOS INVITADO
  guestContainer: {
    padding: 24,
    alignItems: "center",
    paddingTop: 50,
  },
  guestIconCircle: {
    marginBottom: 12,
  },
  guestBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  guestBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#000684",
    letterSpacing: 0.5,
  },
  guestTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 6,
    textAlign: "center",
  },
  guestSub: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  guestFeaturesCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 22,
  },
  guestFeatureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  guestFeatureText: {
    fontSize: 13,
    color: "#334155",
    flex: 1,
  },
  btnGuestLogin: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000684",
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000684",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    marginBottom: 12,
  },
  btnGuestLoginText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  btnGuestRegister: {
    alignItems: "center",
    paddingVertical: 8,
  },
  btnGuestRegisterText: {
    color: "#0056BD",
    fontSize: 13,
    fontWeight: "600",
  },

  // MODALES
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCardLarge: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 22,
    width: "100%",
    maxHeight: "85%",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#000684",
  },
  modalSubtitle: {
    fontSize: 11,
    color: "#64748B",
  },
  modalIconBoxBig: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#E8F8EE",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 12,
  },
  modalTitleCenter: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#000684",
    textAlign: "center",
  },
  modalSubCenter: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 16,
  },
  cardItemCompra: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderColor: "#E2E8F0",
    borderWidth: 1,
  },
  compraHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  folioText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "bold",
  },
  badgeEstatus: {
    backgroundColor: "#E8F8EE",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeEstatusText: {
    color: "#137333",
    fontSize: 10,
    fontWeight: "bold",
  },
  compraProductoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 6,
  },
  compraFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  compraFechaText: {
    fontSize: 11,
    color: "#64748B",
  },
  compraPrecioText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#000684",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#334155",
    marginTop: 10,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  monederoCardBox: {
    backgroundColor: "#F0FDF4",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    borderColor: "#BBF7D0",
    borderWidth: 1,
    marginBottom: 14,
  },
  monederoPuntosLabel: {
    fontSize: 11,
    color: "#15803D",
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  monederoPuntosValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#15803D",
    marginTop: 2,
  },
  monederoDivider: {
    height: 1,
    backgroundColor: "#BBF7D0",
    marginVertical: 10,
    width: "100%",
  },
  monederoPesosLabel: {
    fontSize: 11,
    color: "#000684",
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  monederoPesosValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000684",
    marginTop: 2,
  },
  monederoTip: {
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  monederoTipText: {
    flex: 1,
    fontSize: 12,
    color: "#1E40AF",
    lineHeight: 16,
  },
  btnCerrarModal: {
    backgroundColor: "#000684",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 6,
  },
  btnCerrarText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default ProfileScreen;

