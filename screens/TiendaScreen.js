import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  Alert
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { gql, useMutation } from "@apollo/client";

const CREAR_COMPRA = gql`
  mutation crearCompra($input: CompraInput!) {
    crearCompra(input: $input) {
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

const PRODUCTOS_DEMO = [
  {
    id: "1",
    titulo: "CheckUp Preventivo Integral",
    categoria: "Paquetes",
    precio: 1499.00,
    precioTexto: "$1,499.00 MXN",
    imagen: "https://i.imgur.com/jrViBRq.jpeg",
    descripcion: "Incluye Análisis Clínicos, Radiografía de Tórax y Ultrasonido General.",
  },
  {
    id: "2",
    titulo: "Resonancia Magnética de Cerebro",
    categoria: "Estudios Especiales",
    precio: 3850.00,
    precioTexto: "$3,850.00 MXN",
    imagen: "https://i.imgur.com/NqSHDQx.png",
    descripcion: "Estudio de alta definición para diagnóstico neurológico completo.",
  },
  {
    id: "3",
    titulo: "Tomografía Multicorte de Abdomen",
    categoria: "Tomografía",
    precio: 2900.00,
    precioTexto: "$2,900.00 MXN",
    imagen: "https://i.imgur.com/2XLVK0I.jpeg",
    descripcion: "Evaluación precisa tridimensional de órganos abdominales.",
  },
  {
    id: "4",
    titulo: "Reembolso e Informe Médico Digital",
    categoria: "Servicios Digitales",
    precio: 450.00,
    precioTexto: "$450.00 MXN",
    imagen: "https://i.imgur.com/Zktxl1j.jpeg",
    descripcion: "Gestión digital de facturas e historial clínico para aseguradoras.",
  },
];

const parseJwt = (tokenStr) => {
  try {
    const base64Url = tokenStr.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

const TiendaScreen = () => {
  const navigation = useNavigation();
  const [carrito, setCarrito] = useState([]);
  const [modalCarrito, setModalCarrito] = useState(false);
  const [modalExito, setModalExito] = useState(false);
  const [compraExitosaInfo, setCompraExitosaInfo] = useState(null);
  const [userCurp, setUserCurp] = useState("");
  const [usarMonedero, setUsarMonedero] = useState(false);

  const [crearCompra, { loading: loadingCompra }] = useMutation(CREAR_COMPRA);

  useEffect(() => {
    const getCurp = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          const decoded = parseJwt(token);
          if (decoded && decoded.curp) {
            setUserCurp(decoded.curp);
          }
        }
      } catch (err) {
        console.log("Error al leer curp:", err);
      }
    };
    getCurp();
  }, []);

  const agregarAlCarrito = (producto) => {
    setCarrito((prev) => [...prev, producto]);
    Alert.alert(
      "🛒 Producto Agregado",
      `"${producto.titulo}" se ha añadido a tu carrito.`
    );
  };

  const eliminarDelCarrito = (index) => {
    setCarrito((prev) => prev.filter((_, i) => i !== index));
  };

  const calcularTotal = () => {
    const subtotal = carrito.reduce((sum, item) => sum + item.precio, 0);
    const descuento = usarMonedero ? 100 : 0;
    const total = Math.max(0, subtotal - descuento);
    return { subtotal, descuento, total };
  };

  const procesarCompra = async () => {
    if (carrito.length === 0) {
      Alert.alert("Carrito Vacío", "Selecciona al menos un producto para continuar.");
      return;
    }

    const { total, descuento } = calcularTotal();
    const curpFinal = userCurp || "PACIENTE-WEB";
    const nombresProductos = carrito.map((c) => c.titulo).join(", ");
    const precioFinalTexto = `$${total.toFixed(2)} MXN`;

    try {
      const { data } = await crearCompra({
        variables: {
          input: {
            curp: curpFinal,
            producto: nombresProductos,
            precio: precioFinalTexto,
            monederoUsado: descuento > 0 ? "$100.00 MXN" : "$0.00 MXN",
          },
        },
      });

      if (data && data.crearCompra) {
        setCompraExitosaInfo(data.crearCompra);
        setCarrito([]);
        setModalCarrito(false);
        setModalExito(true);
      }
    } catch (err) {
      console.error("Error al procesar compra:", err);
      Alert.alert("Error de Pago", "No se pudo registrar la compra. Inténtalo de nuevo.");
    }
  };

  const renderProducto = ({ item }) => (
    <View style={styles.cardProducto}>
      <Image source={{ uri: item.imagen }} style={styles.imagenProducto} />
      <View style={styles.badgeCategoria}>
        <Text style={styles.badgeText}>{item.categoria}</Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.tituloProducto} numberOfLines={2}>
          {item.titulo}
        </Text>
        <Text style={styles.descripcionProducto} numberOfLines={2}>
          {item.descripcion}
        </Text>

        <View style={styles.precioRow}>
          <Text style={styles.precioText}>{item.precioTexto}</Text>
          <TouchableOpacity
            style={styles.btnComprar}
            onPress={() => agregarAlCarrito(item)}
          >
            <Ionicons name="cart-outline" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.btnComprarText}>Agregar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const { subtotal, descuento, total } = calcularTotal();

  return (
    <SafeAreaView style={styles.background}>
      {/* Modal Confirmación de Éxito */}
      <Modal visible={modalExito} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <MaterialIcons name="check-circle" size={80} color="#137333" style={{ alignSelf: "center", marginBottom: 15 }} />
            <Text style={styles.exitoTitulo}>¡COMPRA EXITOSA!</Text>
            <Text style={styles.exitoSubtitulo}>
              Tu orden ha sido registrada en el sistema de Imagen Médica MRI.
            </Text>
            <Text style={styles.folioHighlight}>
              Folio: {compraExitosaInfo?.folio || "MRI-ORD-10293"}
            </Text>
            <Text style={styles.exitoDetalle}>
              Puedes consultar los detalles de esta orden en "MIS COMPRAS" desde tu perfil.
            </Text>
            <TouchableOpacity
              style={styles.btnExitoCerrar}
              onPress={() => setModalExito(false)}
            >
              <Text style={styles.btnExitoCerrarText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Carrito de Compras */}
      <Modal visible={modalCarrito} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardLarge}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="cart" size={24} color="#000684" style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>Tu Carrito de Compras</Text>
              </View>
              <TouchableOpacity onPress={() => setModalCarrito(false)}>
                <Ionicons name="close-circle" size={28} color="#999" />
              </TouchableOpacity>
            </View>

            {carrito.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <Ionicons name="cart-outline" size={60} color="#CCC" />
                <Text style={{ marginTop: 10, color: "#666", fontSize: 14 }}>
                  Tu carrito está vacío. Agrega productos del catálogo.
                </Text>
              </View>
            ) : (
              <View style={{ width: "100%", maxHeight: 300 }}>
                <ScrollView>
                  {carrito.map((item, idx) => (
                    <View key={idx} style={styles.cartItemRow}>
                      <Image source={{ uri: item.imagen }} style={styles.cartItemThumb} />
                      <View style={{ flex: 1, paddingHorizontal: 10 }}>
                        <Text style={styles.cartItemTitle} numberOfLines={1}>{item.titulo}</Text>
                        <Text style={styles.cartItemPrice}>{item.precioTexto}</Text>
                      </View>
                      <TouchableOpacity onPress={() => eliminarDelCarrito(idx)}>
                        <Ionicons name="trash-outline" size={22} color="#D32F2F" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  style={[styles.monederoToggle, usarMonedero && styles.monederoToggleActive]}
                  onPress={() => setUsarMonedero(!usarMonedero)}
                >
                  <Ionicons name="wallet-outline" size={20} color={usarMonedero ? "#FFFFFF" : "#0056BD"} />
                  <Text style={[styles.monederoToggleText, usarMonedero && { color: "#FFFFFF" }]}>
                    {usarMonedero ? "✓ Aplicando $100 MXN de Puntos MRI" : "Usar Puntos Monedero MRI (-$100.00)"}
                  </Text>
                </TouchableOpacity>

                <View style={styles.totalBox}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Subtotal:</Text>
                    <Text style={styles.totalValue}>${subtotal.toFixed(2)} MXN</Text>
                  </View>
                  {usarMonedero && (
                    <View style={styles.totalRow}>
                      <Text style={{ color: "#137333", fontSize: 13 }}>Descuento Monedero:</Text>
                      <Text style={{ color: "#137333", fontSize: 13, fontWeight: "bold" }}>-$100.00 MXN</Text>
                    </View>
                  )}
                  <View style={[styles.totalRow, { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: "#DDD" }]}>
                    <Text style={styles.totalLabelBig}>Total a Pagar:</Text>
                    <Text style={styles.totalValueBig}>${total.toFixed(2)} MXN</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.btnPagar}
                  onPress={procesarCompra}
                  disabled={loadingCompra}
                >
                  {loadingCompra ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.btnPagarText}>Proceder al Pago / Finalizar</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Header Tienda */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require("../assets/logos/logoph.png")}
            style={styles.logoHeader}
          />
          <Text style={styles.headerTitle}>Tienda MRI</Text>
        </View>
        <TouchableOpacity
          style={styles.carritoBtn}
          onPress={() => setModalCarrito(true)}
        >
          <Ionicons name="cart" size={28} color="#000684" />
          {carrito.length > 0 && (
            <View style={styles.badgeCarrito}>
              <Text style={styles.badgeCarritoText}>{carrito.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Subheader Banner */}
      <View style={styles.bannerInfo}>
        <Ionicons name="shield-checkmark" size={20} color="#0056BD" style={{ marginRight: 8 }} />
        <Text style={styles.bannerInfoText}>
          Precios exclusivos en línea. Acumula puntos en tu Monedero MRI.
        </Text>
      </View>

      <FlatList
        data={PRODUCTOS_DEMO}
        keyExtractor={(item) => item.id}
        renderItem={renderProducto}
        contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 30, paddingTop: 10 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#F4F6F9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoHeader: {
    width: 90,
    height: 40,
    resizeMode: "contain",
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000684",
  },
  carritoBtn: {
    padding: 6,
    position: "relative",
  },
  badgeCarrito: {
    position: "absolute",
    top: 2,
    right: 0,
    backgroundColor: "#D32F2F",
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeCarritoText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  bannerInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F4FD",
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 15,
    marginTop: 12,
    borderRadius: 8,
    borderColor: "#BBE0FF",
    borderWidth: 1,
  },
  bannerInfoText: {
    fontSize: 12,
    color: "#0056BD",
    fontWeight: "600",
    flex: 1,
  },
  cardProducto: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imagenProducto: {
    width: "100%",
    height: 160,
    resizeMode: "cover",
  },
  badgeCategoria: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#000684",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  infoContainer: {
    padding: 15,
  },
  tituloProducto: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 4,
  },
  descripcionProducto: {
    fontSize: 13,
    color: "#666666",
    marginBottom: 12,
    lineHeight: 18,
  },
  precioRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  precioText: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#000684",
  },
  btnComprar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000684",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  btnComprarText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalCardLarge: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    width: "95%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#000684",
  },
  cartItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  cartItemThumb: {
    width: 45,
    height: 45,
    borderRadius: 6,
  },
  cartItemTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#333",
  },
  cartItemPrice: {
    fontSize: 12,
    color: "#000684",
    fontWeight: "600",
  },
  monederoToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F4FD",
    padding: 10,
    borderRadius: 8,
    marginVertical: 12,
    borderColor: "#BBE0FF",
    borderWidth: 1,
  },
  monederoToggleActive: {
    backgroundColor: "#0056BD",
  },
  monederoToggleText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0056BD",
    marginLeft: 6,
  },
  totalBox: {
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  totalLabel: {
    fontSize: 13,
    color: "#666",
  },
  totalValue: {
    fontSize: 13,
    color: "#333",
    fontWeight: "600",
  },
  totalLabelBig: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
  },
  totalValueBig: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#000684",
  },
  btnPagar: {
    backgroundColor: "#000684",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  btnPagarText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  exitoTitulo: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#137333",
    marginBottom: 8,
    textAlign: "center",
  },
  exitoSubtitulo: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  folioHighlight: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000684",
    marginVertical: 8,
    textAlign: "center",
    backgroundColor: "#E8F4FD",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  exitoDetalle: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginBottom: 15,
  },
  btnExitoCerrar: {
    backgroundColor: "#000684",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  btnExitoCerrarText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default TiendaScreen;
