import React, { useEffect, useState } from "react";
import { useQuery, gql, useApolloClient } from "@apollo/client";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Button,
  Alert,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import base64 from "base-64";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

const OBTENER_ARCHIVOS_POR_CURP = gql`
  query ObtenerArchivosPorCurp($curp: String!) {
    obtenerArchivosPorCurp(curp: $curp) {
      nombre
      tipo
      contenido
      nota
      orden
    }
  }
`;

const OBTENER_LAB_POR_CURP = gql`
  query ObtenerLabPorCurp($curp: String!) {
    obtenerLabPorCurp(curp: $curp) {
      nonota
      estudio
      fecha_prin
      inc
      clave_est
      id_pac
    }
  }
`;

const DESCARGAR_ARCHIVO = gql`
  query DescargarArchivo($rutaArchivo: String!) {
    descargarArchivo(rutaArchivo: $rutaArchivo) {
      nombre
      tipo
      contenido
    }
  }
`;

const DESCARGAR_LABORATORIO = gql`
  query DescargarLaboratorio(
    $id_pac: String!,
    $fecha_prin: String!,
    $nonota: String!,
    $clave_est: String!,
    $inc: String!
  ) {
    descargarLaboratorio(
      id_pac: $id_pac,
      fecha_prin: $fecha_prin,
      nonota: $nonota,
      clave_est: $clave_est,
      inc: $inc
    ) {
      nombre
      tipo
      contenido
    }
  }
`;

const HistorialStudio = () => {
  const navigation = useNavigation();
  const client = useApolloClient();
  const [token, setToken] = useState(null);
  const [curp, setCurp] = useState(null);
  const [archivos, setArchivos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [labLoading, setLabLoading] = useState(true);
  const [labs, setLabs] = useState([]);

  useEffect(() => {
    const getTokenAndDecode = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        setToken(storedToken);

        if (storedToken) {
          const decodedToken = JSON.parse(
            base64.decode(storedToken.split(".")[1])
          );
          const curpFromToken = decodedToken.curp;
          setCurp(curpFromToken);
        }
      } catch (error) {
        console.error("Error al obtener y decodificar el token:", error);
      }
    };

    getTokenAndDecode();
  }, []);

  const { loading: queryLoading, data } = useQuery(OBTENER_ARCHIVOS_POR_CURP, {
    variables: { curp },
    skip: !curp,
  });

  const { loading: labQueryLoading, data: labData } = useQuery(OBTENER_LAB_POR_CURP, {
    variables: { curp },
    skip: !curp,
  });

  useEffect(() => {
    if (!queryLoading) {
      if (data && data.obtenerArchivosPorCurp) {
        setArchivos(data.obtenerArchivosPorCurp);
      }
      setLoading(false);
    }
  }, [queryLoading, data]);

  useEffect(() => {
    if (!labQueryLoading) {
      if (labData && labData.obtenerLabPorCurp) {
        setLabs(labData.obtenerLabPorCurp);
      }
      setLabLoading(false);
    }
  }, [labQueryLoading, labData]);

  const handleDownload = async (rutaArchivo, nombre) => {
    try {
      const { data } = await client.query({
        query: DESCARGAR_ARCHIVO,
        variables: { rutaArchivo },
      });

      if (!data.descargarArchivo) {
        throw new Error('Archivo no encontrado');
      }

      const fileUri = `${FileSystem.documentDirectory}${data.descargarArchivo.nombre}`;
      await FileSystem.writeAsStringAsync(fileUri, data.descargarArchivo.contenido, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Archivo guardado", `Archivo guardado en: ${fileUri}`);
      }
    } catch (error) {
      console.error("Error al descargar el archivo:", error);
      Alert.alert("Ups, algo salió mal", "No se pudo descargar el archivo");
    }
  };

  const handleDownloadLaboratorio = async (lab) => {
    try {
      if (!lab || !lab.nonota || !lab.fecha_prin || !lab.clave_est || !lab.inc) {
        throw new Error('Datos del laboratorio incompletos.');
      }
  
      const { id_pac, nonota, fecha_prin, clave_est, inc } = lab;
  
      const { data } = await client.query({
        query: DESCARGAR_LABORATORIO,
        variables: {
          id_pac: id_pac,
          fecha_prin: fecha_prin,
          nonota: nonota,
          clave_est: clave_est,
          inc: inc
        },
      });
  
      if (!data.descargarLaboratorio) {
        throw new Error('Archivo no encontrado');
      }

      const fileUri = `${FileSystem.documentDirectory}${data.descargarLaboratorio.nombre}`;
      await FileSystem.writeAsStringAsync(fileUri, data.descargarLaboratorio.contenido, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Archivo guardado", `Archivo guardado en: ${fileUri}`);
      }
    } catch (error) {
      console.error("Error al descargar el archivo de laboratorio:", error);
      Alert.alert("Ups, algo salió mal", "No se pudo descargar el archivo");
    }
  };

  const obtenerFechaDeRuta = (ruta) => {
    if (!ruta) return "N/A";
    const partes = ruta.split("/");
    if (partes.length >= 3) {
      return `${partes[0]}/${partes[1]}/${partes[2]}`;
    }
    return "Formato no válido";
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER SUPERIOR CON BOTÓN DE REGRESO */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.topHeaderTitle}>Historial de Estudios</Text>
          <Text style={styles.topHeaderSub}>Resultados, reportes y laboratorios</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingBottom: 30 }}>
        {!token ? (
          <View style={styles.loggedOutCard}>
            <View style={styles.loggedOutIconBox}>
              <Ionicons name="lock-closed" size={36} color="#000684" />
            </View>
            <Text style={styles.loggedOutTitle}>Inicia Sesión para Ver tus Resultados</Text>
            <Text style={styles.loggedOutSub}>
              Accede con tu cuenta para consultar y descargar tus reportes médicos, interpretaciones y análisis de laboratorio.
            </Text>
            <TouchableOpacity
              style={styles.loggedOutBtn}
              onPress={() => navigation.navigate("Configuracion")}
              activeOpacity={0.85}
            >
              <Text style={styles.loggedOutBtnText}>Iniciar Sesión Ahora</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {loading || labLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#000684" />
                <Text style={styles.loadingText}>Cargando historial de estudios...</Text>
              </View>
            ) : archivos.length === 0 && labs.length === 0 ? (
              <View style={styles.noEstudiosBox}>
                <View style={styles.noEstudiosIconCircle}>
                  <MaterialIcons name="folder-open" size={44} color="#000684" />
                </View>
                <Text style={styles.noEstudiosTitulo}>Aún no tienes estudios disponibles</Text>
                <Text style={styles.noEstudiosTexto}>
                  No encontramos registros de estudios ni interpretaciones vinculados a tu cuenta en Imagen Médica MRI.
                </Text>
                <Text style={styles.noEstudiosSubtexto}>
                  Al realizarte un estudio en cualquiera de nuestras sucursales, tus resultados aparecerán automáticamente aquí.
                </Text>
              </View>
            ) : (
              <>
                {archivos.length > 0 && (
                  <View style={styles.sectionWrapper}>
                    <View style={styles.headerContainer}>
                      <View style={[styles.headerIconBadge, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                        <MaterialIcons name="description" size={20} color="#FFFFFF" />
                      </View>
                      <Text style={styles.header}>Interpretaciones</Text>
                      <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>{archivos.length}</Text>
                      </View>
                    </View>

                    <View style={styles.tableCard}>
                      <View style={styles.tableHeaderRow}>
                        <Text style={[styles.tableCellHead, { flex: 1.4 }]}>Estudio</Text>
                        <Text style={[styles.tableCellHead, { flex: 0.9 }]}>Nota</Text>
                        <Text style={[styles.tableCellHead, { flex: 1 }]}>Fecha</Text>
                        <Text style={[styles.tableCellHead, { flex: 1.1 }]}>Acción</Text>
                      </View>

                      <FlatList
                        data={archivos}
                        keyExtractor={(item, index) => index.toString()}
                        scrollEnabled={false}
                        renderItem={({ item, index }) => {
                          const fechaExtraida = obtenerFechaDeRuta(item.contenido);
                          const isEven = index % 2 === 0;
                          return (
                            <View style={[styles.tableRow, isEven ? styles.rowEven : styles.rowOdd]}>
                              <Text style={[styles.tableCell, { flex: 1.4, fontWeight: "600", color: "#0F172A" }]} numberOfLines={2}>
                                {item.nombre}
                              </Text>
                              <Text style={[styles.tableCell, { flex: 0.9, color: "#475569" }]} numberOfLines={1}>
                                {item.orden || item.nota || "—"}
                              </Text>
                              <Text style={[styles.tableCell, { flex: 1, color: "#64748B", fontSize: 11 }]} numberOfLines={1}>
                                {fechaExtraida}
                              </Text>
                              <View style={[styles.tableCellBtn, { flex: 1.1 }]}>
                                <TouchableOpacity
                                  style={styles.actionBtnDownload}
                                  onPress={() => handleDownload(item.contenido, item.nombre)}
                                  activeOpacity={0.8}
                                >
                                  <Ionicons name="download-outline" size={13} color="#FFFFFF" style={{ marginRight: 3 }} />
                                  <Text style={styles.actionBtnText}>Descargar</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          );
                        }}
                      />
                    </View>
                  </View>
                )}

                {labs.length > 0 && (
                  <View style={styles.sectionWrapper}>
                    <View style={styles.headerContainer}>
                      <View style={[styles.headerIconBadge, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                        <MaterialIcons name="science" size={20} color="#FFFFFF" />
                      </View>
                      <Text style={styles.header}>Laboratorio</Text>
                      <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>{labs.length}</Text>
                      </View>
                    </View>

                    <View style={styles.tableCard}>
                      <View style={styles.tableHeaderRow}>
                        <Text style={[styles.tableCellHead, { flex: 1.4 }]}>Estudio</Text>
                        <Text style={[styles.tableCellHead, { flex: 0.9 }]}>Nota</Text>
                        <Text style={[styles.tableCellHead, { flex: 1 }]}>Fecha</Text>
                        <Text style={[styles.tableCellHead, { flex: 1.1 }]}>Acción</Text>
                      </View>

                      <FlatList
                        data={labs}
                        keyExtractor={(item, index) => index.toString()}
                        scrollEnabled={false}
                        renderItem={({ item, index }) => {
                          const isEven = index % 2 === 0;
                          return (
                            <View style={[styles.tableRow, isEven ? styles.rowEven : styles.rowOdd]}>
                              <Text style={[styles.tableCell, { flex: 1.4, fontWeight: "600", color: "#0F172A" }]} numberOfLines={2}>
                                {item.estudio}
                              </Text>
                              <Text style={[styles.tableCell, { flex: 0.9, color: "#475569" }]} numberOfLines={1}>
                                {item.nonota || "—"}
                              </Text>
                              <Text style={[styles.tableCell, { flex: 1, color: "#64748B", fontSize: 11 }]} numberOfLines={1}>
                                {item.fecha_prin ? new Date(item.fecha_prin).toLocaleDateString("es-MX") : "N/A"}
                              </Text>
                              <View style={[styles.tableCellBtn, { flex: 1.1 }]}>
                                <TouchableOpacity
                                  style={[styles.actionBtnDownload, { backgroundColor: "#15803D" }]}
                                  onPress={() => handleDownloadLaboratorio(item)}
                                  activeOpacity={0.8}
                                >
                                  <Ionicons name="document-text-outline" size={13} color="#FFFFFF" style={{ marginRight: 3 }} />
                                  <Text style={styles.actionBtnText}>Archivo</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          );
                        }}
                      />
                    </View>
                  </View>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },
  topHeader: {
    backgroundColor: "#000684",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 18,
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
  topHeaderTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  topHeaderSub: {
    fontSize: 12,
    color: "#93C5FD",
    marginTop: 2,
  },
  loggedOutCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 24,
    marginTop: 30,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  loggedOutIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  loggedOutTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 6,
  },
  loggedOutSub: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  loggedOutBtn: {
    backgroundColor: "#000684",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  loggedOutBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  loadingBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 28,
    marginTop: 30,
    alignItems: "center",
    elevation: 2,
  },
  loadingText: {
    fontSize: 14,
    color: "#000684",
    fontWeight: "600",
    marginTop: 12,
  },
  noEstudiosBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 26,
    marginTop: 24,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  noEstudiosIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  noEstudiosTitulo: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#000684",
    marginBottom: 8,
    textAlign: "center",
  },
  noEstudiosTexto: {
    fontSize: 13,
    color: "#475569",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 10,
  },
  noEstudiosSubtexto: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 16,
  },
  sectionWrapper: {
    marginTop: 18,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000684",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  headerIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  header: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#FFFFFF",
    flex: 1,
  },
  countBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  tableCard: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderTopWidth: 0,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  tableCellHead: {
    fontWeight: "700",
    color: "#475569",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    alignItems: "center",
  },
  rowEven: {
    backgroundColor: "#FFFFFF",
  },
  rowOdd: {
    backgroundColor: "#F8FAFC",
  },
  tableCell: {
    paddingHorizontal: 4,
    textAlign: "center",
    fontSize: 12,
  },
  tableCellBtn: {
    paddingHorizontal: 2,
    alignItems: "center",
  },
  actionBtnDownload: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000684",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    width: "100%",
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },
});

export default HistorialStudio;
