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
  ScrollView
} from "react-native";
import base64 from "base-64";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { MaterialIcons } from '@expo/vector-icons';

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
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {!token ? (
          <View style={styles.container2}>
            <Text style={styles.tituloDeneg}>
              Parece que aún no has iniciado sesión. Inicia sesión aquí.
            </Text>
            <Button
              title="Iniciar Sesión"
              color="#000066"
              style={styles.button}
              onPress={() => navigation.navigate("Configuracion")}
            />
          </View>
        ) : (
          <>
            {loading || labLoading ? (
              <ActivityIndicator size="large" color="#000066" style={{ marginTop: 40 }} />
            ) : archivos.length === 0 && labs.length === 0 ? (
              <View style={styles.noEstudiosBox}>
                <MaterialIcons name="info-outline" size={60} color="#000066" style={{ alignSelf: "center", marginBottom: 12 }} />
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
                  <>
                    <View style={styles.headerContainer}>
                      <Text style={styles.header}>Interpretaciones</Text>
                      <MaterialIcons name="description" size={32} color="#fff" style={styles.icon} />
                    </View>

                    <View style={styles.table}>
                      <View style={styles.tableRow}>
                        <Text style={[styles.tableCell, styles.tableHeader]}>Estudio</Text>
                        <Text style={[styles.tableCell, styles.tableHeader]}>Nota</Text>
                        <Text style={[styles.tableCell, styles.tableHeader]}>Fecha</Text>
                        <Text style={[styles.tableCell, styles.tableHeader]}>Acción</Text>
                      </View>

                      <FlatList
                        data={archivos}
                        keyExtractor={(item, index) => index.toString()}
                        scrollEnabled={false}
                        renderItem={({ item }) => {
                          const fechaExtraida = obtenerFechaDeRuta(item.contenido);
                          return (
                            <View style={styles.tableRow}>
                              <Text style={styles.tableCell}>{item.nombre}</Text>
                              <Text style={styles.tableCell}>{item.orden}</Text>
                              <Text style={styles.tableCell}>{fechaExtraida}</Text>
                              <View style={styles.tableCellBtn}>
                                <Button
                                  title="Descargar"
                                  onPress={() => handleDownload(item.contenido, item.nombre)} 
                                  color="#000066"
                                />
                              </View>
                            </View>
                          );
                        }}
                      />
                    </View>
                  </>
                )}

                {labs.length > 0 && (
                  <>
                    <View style={styles.headerContainer}>
                      <Text style={styles.header}>Laboratorio</Text>
                      <MaterialIcons name="science" size={32} color="#fff" style={styles.icon} />
                    </View>

                    <View style={styles.table}>
                      <View style={styles.tableRow}>
                        <Text style={[styles.tableCell, styles.tableHeader]}>Estudio</Text>
                        <Text style={[styles.tableCell, styles.tableHeader]}>Nota</Text>
                        <Text style={[styles.tableCell, styles.tableHeader]}>Fecha</Text>
                        <Text style={[styles.tableCell, styles.tableHeader]}>Acción</Text>
                      </View>

                      <FlatList
                        data={labs}
                        keyExtractor={(item, index) => index.toString()}
                        scrollEnabled={false}
                        renderItem={({ item }) => (
                          <View style={styles.tableRow}>
                            <Text style={styles.tableCell}>{item.estudio}</Text>
                            <Text style={styles.tableCell}>{item.nonota}</Text>
                            <Text style={styles.tableCell}>
                              {item.fecha_prin ? new Date(item.fecha_prin).toLocaleDateString() : 'N/A'}
                            </Text>
                            <View style={styles.tableCellBtn}>
                              <Button
                                title="Archivo"
                                onPress={() => handleDownloadLaboratorio(item)}
                                color="#000066"
                              />
                            </View>
                          </View>
                        )}
                      />
                    </View>
                  </>
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
    backgroundColor: "#ffffff",
    padding: 16,
  },
  container2: {
    backgroundColor: "#000066",
    padding: 24,
    borderRadius: 10,
    marginTop: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  tituloDeneg: {
    fontSize: 18,
    color: "#ffffff",
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    marginTop: 20,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000066",
    padding: 12,
    borderRadius: 6,
    marginTop: 20
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
  },
  icon: {
    marginRight: 4,
  },
  table: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 6,
    overflow: "hidden",
    marginTop: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    alignItems: "center",
  },
  tableCell: {
    flex: 1,
    padding: 8,
    textAlign: "center",
    fontSize: 13,
  },
  tableCellBtn: {
    flex: 1,
    padding: 4,
  },
  tableHeader: {
    fontWeight: "bold",
    backgroundColor: "#F0F0F0",
    color: "#333",
  },
  noEstudiosBox: {
    backgroundColor: "#F4F6F9",
    borderRadius: 12,
    padding: 24,
    marginTop: 30,
    marginHorizontal: 10,
    alignItems: "center",
    borderColor: "#E1E6ED",
    borderWidth: 1,
  },
  noEstudiosTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000066",
    marginBottom: 10,
    textAlign: "center",
  },
  noEstudiosTexto: {
    fontSize: 14,
    color: "#444",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 12,
  },
  noEstudiosSubtexto: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
});

export default HistorialStudio;
