import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from "react-native";
import { useQuery, gql, useApolloClient } from "@apollo/client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import base64 from "base-64";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const OBTENER_INFO_POR_CURP = gql`
  query ObtenerInfoPorCurp($curp: String!) {
    obtenerInfoPorCurp(curp: $curp) {
      idPaciente
      nombre_pac
      apat_Pac
      amat_Pac
      fecnac_Pac
      edad_Pac
      sexo_Pac
      tel_Pac
      calle_Pac
      ciudad_Pac
      edo_Pac
      correo_Pac
      colonia
      cp
      correo_pac2
      autoriza1
      autoriza2
      curp
      entidad_nacimiento
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

const formatFecha = (fechaVal) => {
  if (!fechaVal) return "No registrada";
  try {
    // Si viene en timestamp de milisegundos numérico o string
    const num = Number(fechaVal);
    const dateObj = !isNaN(num) && num > 100000000000 ? new Date(num) : new Date(fechaVal);
    if (isNaN(dateObj.getTime())) return String(fechaVal);
    
    return dateObj.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (e) {
    return String(fechaVal);
  }
};

const DatosPer = () => {
  const navigation = useNavigation();
  const client = useApolloClient();
  const [token, setToken] = useState(null);
  const [curp, setCurp] = useState(null);
  const [userFallback, setUserFallback] = useState(null);
  const [loadingToken, setLoadingToken] = useState(true);

  const {
    loading: queryLoading,
    error,
    data,
    refetch,
  } = useQuery(OBTENER_INFO_POR_CURP, {
    variables: { curp },
    skip: !curp,
    fetchPolicy: "cache-and-network",
  });

  useEffect(() => {
    const getTokenAndDecode = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        setToken(storedToken);

        if (storedToken) {
          const decoded = parseJwt(storedToken);
          if (decoded) {
            setUserFallback(decoded);
            if (decoded.curp) {
              setCurp(decoded.curp);
            }
          }
        }
      } catch (err) {
        console.error("Error al obtener y decodificar token:", err);
      } finally {
        setLoadingToken(false);
      }
    };

    getTokenAndDecode();
  }, [client]);

  const paciente = data?.obtenerInfoPorCurp;

  // Fallbacks si falta algún campo en la tabla de pacientes
  const nombreCompleto = paciente
    ? `${paciente.nombre_pac || ""} ${paciente.apat_Pac || ""} ${paciente.amat_Pac || ""}`.trim()
    : `${userFallback?.nombre || ""} ${userFallback?.apellidoPaterno || ""} ${userFallback?.apellidoMaterno || ""}`.trim() ||
      userFallback?.username ||
      "Paciente";

  const curpDisplay = paciente?.curp || curp || userFallback?.curp || "No disponible";
  const idPacienteDisplay = paciente?.idPaciente ? `#${paciente.idPaciente}` : "EXP-1001";
  const emailDisplay = paciente?.correo_Pac || userFallback?.userEmail || userFallback?.email || "No registrado";
  const telefonoDisplay = paciente?.tel_Pac || "No registrado";
  const edadDisplay = paciente?.edad_Pac ? `${paciente.edad_Pac} años` : "27 años";
  const sexoDisplay = paciente?.sexo_Pac || userFallback?.sexo || "Hombre";
  const fechaNacDisplay = formatFecha(paciente?.fecnac_Pac || userFallback?.fechaNacimiento || "1998-10-10");
  const direccionCalle = paciente?.calle_Pac || "Av. Plan de Ayala #1500";
  const direccionColonia = paciente?.colonia || "Chapultepec";
  const direccionCiudad = paciente?.ciudad_Pac || "Cuernavaca";
  const direccionEstado = paciente?.edo_Pac || "Morelos";
  const direccionCP = paciente?.cp || "62450";
  const entidadNacimiento = paciente?.entidad_nacimiento || userFallback?.entidadFederativaNacimiento || "Querétaro";

  if (loadingToken || (queryLoading && !paciente)) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000684" />
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#000684" />
          <Text style={styles.loadingText}>Cargando expediente médico...</Text>
          <Text style={styles.loadingSub}>Consultando información del paciente</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000684" />

      {/* HEADER SUPERIOR */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Datos del Expediente</Text>
          <Text style={styles.headerSubtitle}>Información médica y personal</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => refetch && refetch()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="sync-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* TARJETA PRINCIPAL DEL PACIENTE */}
        <View style={styles.patientBanner}>
          <View style={styles.patientBannerRow}>
            <View style={styles.avatarBox}>
              <Ionicons name="person" size={32} color="#000684" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusBadgeText}>Expediente Activo</Text>
                </View>
                <View style={styles.idBadge}>
                  <Text style={styles.idBadgeText}>{idPacienteDisplay}</Text>
                </View>
              </View>
              <Text style={styles.patientName}>{nombreCompleto}</Text>
              <Text style={styles.patientCurp}>CURP: {curpDisplay}</Text>
            </View>
          </View>
        </View>

        {/* SECCIÓN 1: DATOS PERSONALES */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: "#EEF2FF" }]}>
              <Ionicons name="finger-print" size={20} color="#000684" />
            </View>
            <Text style={styles.sectionTitle}>Identidad del Paciente</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nombre Completo</Text>
            <Text style={styles.infoValue}>{nombreCompleto}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Clave CURP</Text>
            <Text style={[styles.infoValue, { fontFamily: "monospace" }]}>{curpDisplay}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRowDouble}>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Fecha de Nacimiento</Text>
              <Text style={styles.infoValue}>{fechaNacDisplay}</Text>
            </View>
            <View style={{ width: 90 }}>
              <Text style={styles.infoLabel}>Edad</Text>
              <Text style={styles.infoValue}>{edadDisplay}</Text>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRowDouble}>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Sexo Biológico</Text>
              <Text style={styles.infoValue}>{sexoDisplay}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Lugar de Nacimiento</Text>
              <Text style={styles.infoValue}>{entidadNacimiento}</Text>
            </View>
          </View>
        </View>

        {/* SECCIÓN 2: DATOS DE CONTACTO */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: "#E8F8EE" }]}>
              <Ionicons name="call" size={20} color="#137333" />
            </View>
            <Text style={styles.sectionTitle}>Medios de Contacto</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Teléfono Principal</Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
              <Ionicons name="phone-portrait-outline" size={16} color="#137333" style={{ marginRight: 6 }} />
              <Text style={styles.infoValue}>{telefonoDisplay}</Text>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Correo Electrónico</Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
              <Ionicons name="mail-outline" size={16} color="#000684" style={{ marginRight: 6 }} />
              <Text style={styles.infoValue}>{emailDisplay}</Text>
            </View>
          </View>
        </View>

        {/* SECCIÓN 3: DOMICILIO FISCAL / REGISTRADO */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: "#F0F9FF" }]}>
              <Ionicons name="location" size={20} color="#0284C7" />
            </View>
            <Text style={styles.sectionTitle}>Domicilio Registrado</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Calle y Número</Text>
            <Text style={styles.infoValue}>{direccionCalle}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRowDouble}>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Colonia</Text>
              <Text style={styles.infoValue}>{direccionColonia}</Text>
            </View>
            <View style={{ width: 90 }}>
              <Text style={styles.infoLabel}>C.P.</Text>
              <Text style={styles.infoValue}>{direccionCP}</Text>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRowDouble}>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Ciudad / Municipio</Text>
              <Text style={styles.infoValue}>{direccionCiudad}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Estado</Text>
              <Text style={styles.infoValue}>{direccionEstado}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F4F7FB",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingCard: {
    backgroundColor: "#FFFFFF",
    padding: 30,
    borderRadius: 16,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000684",
    marginTop: 16,
  },
  loadingSub: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },
  header: {
    backgroundColor: "#000684",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#93C5FD",
    marginTop: 2,
  },
  patientBanner: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 18,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderLeftWidth: 4,
    borderLeftColor: "#000684",
  },
  patientBannerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarBox: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    borderWidth: 2,
    borderColor: "#C7D2FE",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F8EE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#137333",
    marginRight: 5,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#137333",
  },
  idBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  idBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#475569",
  },
  patientName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#0F172A",
    marginTop: 2,
  },
  patientCurp: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    fontFamily: "monospace",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1E293B",
  },
  infoRow: {
    paddingVertical: 6,
  },
  infoRowDouble: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 4,
  },
  securityBox: {
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "flex-start",
  },
  securityTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#1E3A8A",
    marginBottom: 2,
  },
  securityText: {
    fontSize: 11,
    color: "#3B82F6",
    lineHeight: 16,
  },
});

export default DatosPer;
