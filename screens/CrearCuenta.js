import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { gql, useMutation, useLazyQuery } from "@apollo/client";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";

const CREAR_USUARIO = gql`
  mutation crearUsuario($input: UsuarioInput) {
    crearUsuario(input: $input) {
      curp
      email
      password
      username
      nombre
      apellidoPaterno
      apellidoMaterno
      fechaNacimiento
      entidadFederativaNacimiento
      sexo
    }
  }
`;

const CREACION_POR_CURP = gql`
  query creacionPorCurp($curp: String!) {
    creacionPorCurp(curp: $curp) {
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

const ESTADOS_MEXICO = [
  "Selecciona un estado",
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas",
  "Chihuahua", "Coahuila", "Colima", "CDMX", "Durango", "Guanajuato", "Guerrero",
  "Hidalgo", "Jalisco", "Estado de México", "Michoacán", "Morelos", "Nayarit",
  "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí",
  "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"
];

const MESES = [
  { label: "Enero (01)", value: "01" },
  { label: "Febrero (02)", value: "02" },
  { label: "Marzo (03)", value: "03" },
  { label: "Abril (04)", value: "04" },
  { label: "Mayo (05)", value: "05" },
  { label: "Junio (06)", value: "06" },
  { label: "Julio (07)", value: "07" },
  { label: "Agosto (08)", value: "08" },
  { label: "Septiembre (09)", value: "09" },
  { label: "Octubre (10)", value: "10" },
  { label: "Noviembre (11)", value: "11" },
  { label: "Diciembre (12)", value: "12" },
];

const DIAS = Array.from({ length: 31 }, (_, i) => {
  const d = (i + 1).toString().padStart(2, "0");
  return { label: d, value: d };
});

const ANIOS = Array.from({ length: 90 }, (_, i) => {
  const a = (2026 - i).toString();
  return { label: a, value: a };
});

const REGEX_CURP = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
const REGEX_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const limpiaSoloLetras = (texto) => {
  return texto.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
};

const extraeFechaDeCurp = (curpStr) => {
  if (curpStr && curpStr.length === 18) {
    const aa = curpStr.substring(4, 6);
    const mm = curpStr.substring(6, 8);
    const dd = curpStr.substring(8, 10);
    const anio = parseInt(aa, 10) > 30 ? `19${aa}` : `20${aa}`;
    const fecha = `${anio}-${mm}-${dd}`;
    if (!isNaN(Date.parse(fecha))) {
      return fecha;
    }
  }
  return "1990-01-01";
};

const CrearCuenta = () => {
  const navigation = useNavigation();
  const [curp, setCurp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errora, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [datosObtenidos, setDatosObtenidos] = useState(false);
  const [esPacienteExistente, setEsPacienteExistente] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [cuentaCreadaExitosa, setCuentaCreadaExitosa] = useState(false);

  const [confirmPassword, setConfirmPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmPassword, setMostrarConfirmPassword] = useState(false);

  const [modalFechaVisible, setModalFechaVisible] = useState(false);
  const [diaSel, setDiaSel] = useState("15");
  const [mesSel, setMesSel] = useState("05");
  const [anioSel, setAnioSel] = useState("1995");

  const [input, setInput] = useState({
    curp: "",
    email: "",
    username: "",
    password: "",
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    fechaNacimiento: "",
    entidadFederativaNacimiento: "Morelos",
    sexo: "Hombre",
  });

  const updateFechaLive = (d, m, a) => {
    setDiaSel(d);
    setMesSel(m);
    setAnioSel(a);
    const fechaFormateada = `${a}-${m}-${d}`;
    setInput((prev) => ({ ...prev, fechaNacimiento: fechaFormateada }));
  };

  const [crearUsuario] = useMutation(CREAR_USUARIO);
  const [creacionPorCurp, { loading: queryLoading, error, data }] = useLazyQuery(CREACION_POR_CURP);

  useEffect(() => {
    if (!queryLoading && hasSubmitted) {
      setLoading(false);
      if (data && data.creacionPorCurp) {
        const info = data.creacionPorCurp;
        setEsPacienteExistente(true);
        setDatosObtenidos(true);
        const f = info.fecnac_Pac || extraeFechaDeCurp(info.curp || curp);
        setInput((prev) => ({
          ...prev,
          curp: info.curp || curp,
          nombre: limpiaSoloLetras(info.nombre_pac || ""),
          apellidoPaterno: limpiaSoloLetras(info.apat_Pac || ""),
          apellidoMaterno: limpiaSoloLetras(info.amat_Pac || ""),
          fechaNacimiento: f,
          entidadFederativaNacimiento: info.entidad_nacimiento || "Morelos",
          sexo: info.sexo_Pac === "F" || info.sexo_Pac === "Mujer" ? "Mujer" : "Hombre",
          email: info.correo_Pac || prev.email,
        }));

        if (f && f.length === 10) {
          const p = f.split("-");
          if (p.length === 3) {
            setAnioSel(p[0]);
            setMesSel(p[1]);
            setDiaSel(p[2]);
          }
        }
        setMensaje("¡Paciente encontrado en Imagen Médica MRI! Revisa tus datos y completa tu cuenta.");
      } else {
        setEsPacienteExistente(false);
        setDatosObtenidos(true);
        const f = extraeFechaDeCurp(curp);
        setInput((prev) => ({
          ...prev,
          curp: curp,
          fechaNacimiento: f,
        }));
        if (f && f.length === 10) {
          const p = f.split("-");
          if (p.length === 3) {
            setAnioSel(p[0]);
            setMesSel(p[1]);
            setDiaSel(p[2]);
          }
        }
        setMensaje(
          "Tu CURP no está registrado aún en nuestras sucursales, pero puedes ingresar tus datos y crear tu cuenta ahora."
        );
      }
    }
  }, [queryLoading, data, hasSubmitted]);

  const verificarCurp = () => {
    const curpLimpio = curp.trim().toUpperCase();
    if (curpLimpio.length !== 18) {
      setError("El CURP debe tener exactamente 18 caracteres.");
      return;
    }
    if (!REGEX_CURP.test(curpLimpio)) {
      setError("El CURP no coincide con el formato oficial mexicano (Ej: ALGD981010HMOBLA01).");
      return;
    }
    setLoading(true);
    setHasSubmitted(true);
    setError("");
    setMensaje("");
    creacionPorCurp({ variables: { curp: curpLimpio } });
  };

  const confirmarFechaPicker = () => {
    const fechaFormateada = `${anioSel}-${mesSel}-${diaSel}`;
    setInput((prev) => ({ ...prev, fechaNacimiento: fechaFormateada }));
    setModalFechaVisible(false);
  };

  const handleCrearUsuario = async () => {
    const emailTrimmed = (input.email || "").trim();
    const passwordTrimmed = (input.password || "").trim();
    const confirmPasswordTrimmed = (confirmPassword || "").trim();
    const usernameTrimmed = (input.username || "").trim();
    const nombreTrimmed = limpiaSoloLetras(input.nombre || "").trim();
    const apellidoPaternoTrimmed = limpiaSoloLetras(input.apellidoPaterno || "").trim();
    const apellidoMaternoTrimmed = limpiaSoloLetras(input.apellidoMaterno || "").trim();
    const curpTrimmed = (input.curp || curp || "").trim().toUpperCase();

    if (!emailTrimmed || !passwordTrimmed || !usernameTrimmed || !nombreTrimmed || !apellidoPaternoTrimmed) {
      setError("Por favor llena todos los campos obligatorios (*).");
      return;
    }

    if (curpTrimmed && !REGEX_CURP.test(curpTrimmed)) {
      setError("El CURP no coincide con la estructura oficial mexicana (18 caracteres).");
      return;
    }

    if (!REGEX_EMAIL.test(emailTrimmed)) {
      setError("Por favor ingresa un correo electrónico válido (ejemplo: usuario@correo.com).");
      return;
    }

    if (passwordTrimmed.length <= 6) {
      setError("La contraseña debe tener más de 6 caracteres.");
      return;
    }

    if (passwordTrimmed !== confirmPasswordTrimmed) {
      setError("Las contraseñas no coinciden. Por favor verifícalas.");
      return;
    }

    let fechaFinal = (input.fechaNacimiento || "").trim();
    if (!fechaFinal || fechaFinal === "Invalid date" || isNaN(Date.parse(fechaFinal))) {
      fechaFinal = extraeFechaDeCurp(curpTrimmed);
    }

    const payload = {
      curp: curpTrimmed || `TEMP-${Date.now()}`,
      email: emailTrimmed,
      username: usernameTrimmed,
      password: passwordTrimmed,
      nombre: nombreTrimmed,
      apellidoPaterno: apellidoPaternoTrimmed,
      apellidoMaterno: apellidoMaternoTrimmed,
      fechaNacimiento: fechaFinal,
      entidadFederativaNacimiento: input.entidadFederativaNacimiento || "Morelos",
      sexo: input.sexo || "Hombre",
    };

    try {
      setError("");
      const { data } = await crearUsuario({
        variables: { input: payload },
      });

      if (data && data.crearUsuario) {
        setCuentaCreadaExitosa(true);
        setTimeout(() => {
          setCuentaCreadaExitosa(false);
          navigation.navigate("Configuracion");
        }, 2200);
      }
    } catch (err) {
      console.error("Error al crear usuario:", err);
      const msg = err.graphQLErrors?.[0]?.message || err.message;
      setError(msg || "No se pudo crear el usuario. Verifica que el correo o usuario no existan ya.");
    }
  };

  return (
    <SafeAreaView style={styles.background}>
      <Modal
        visible={cuentaCreadaExitosa}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <MaterialIcons name="check-circle" size={80} color="#137333" style={{ alignSelf: "center", marginBottom: 15 }} />
            <Text style={styles.exitoTitulo}>¡CUENTA CREADA!</Text>
            <Text style={styles.exitoSubtitulo}>
              Tu cuenta se ha registrado exitosamente en Imagen Médica MRI.
            </Text>
            <Text style={styles.exitoDetalle}>
              Redirigiendo al inicio de sesión...
            </Text>
            <View style={{ marginTop: 20, width: "100%" }}>
              <Button
                title="Iniciar Sesión Ahora"
                color="#000684"
                onPress={() => {
                  setCuentaCreadaExitosa(false);
                  navigation.navigate("Configuracion");
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalFechaVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardDatePicker}>
            <Text style={styles.modalTitlePicker}>📅 Selecciona tu Fecha de Nacimiento</Text>
            
            <View style={styles.livePreviewCard}>
              <Text style={styles.livePreviewLabel}>Fecha Seleccionada:</Text>
              <Text style={styles.livePreviewValue}>
                {diaSel} / {MESES.find((m) => m.value === mesSel)?.label.split(" ")[0]} / {anioSel}
              </Text>
              <Text style={styles.livePreviewSub}>
                Formato: {anioSel}-{mesSel}-{diaSel}
              </Text>
            </View>

            <View style={styles.pickerRow}>
              <View style={styles.pickerCol}>
                <Text style={styles.pickerLabelHeader}>Día</Text>
                <Picker
                  selectedValue={diaSel}
                  onValueChange={(val) => updateFechaLive(val, mesSel, anioSel)}
                  style={styles.pickerMini}
                >
                  {DIAS.map((d) => (
                    <Picker.Item key={d.value} label={d.label} value={d.value} />
                  ))}
                </Picker>
              </View>

              <View style={styles.pickerCol}>
                <Text style={styles.pickerLabelHeader}>Mes</Text>
                <Picker
                  selectedValue={mesSel}
                  onValueChange={(val) => updateFechaLive(diaSel, val, anioSel)}
                  style={styles.pickerMini}
                >
                  {MESES.map((m) => (
                    <Picker.Item key={m.value} label={m.label} value={m.value} />
                  ))}
                </Picker>
              </View>

              <View style={styles.pickerCol}>
                <Text style={styles.pickerLabelHeader}>Año</Text>
                <Picker
                  selectedValue={anioSel}
                  onValueChange={(val) => updateFechaLive(diaSel, mesSel, val)}
                  style={styles.pickerMini}
                >
                  {ANIOS.map((a) => (
                    <Picker.Item key={a.value} label={a.label} value={a.value} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={{ marginTop: 20, width: "100%" }}>
              <Button title="Confirmar Fecha" color="#000684" onPress={confirmarFechaPicker} />
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ alignItems: "center" }}>
          <Image
            source={require("../assets/logos/logoph.png")}
            style={styles.imglogo}
          />
        </View>

        {!datosObtenidos ? (
          <View style={styles.formContainerCenter}>
            <Text style={styles.subtituloText}>Crear Cuenta en Imagen Médica</Text>
            <Text style={styles.fieldLabel}>CURP (18 caracteres) *:</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. ALGD981010HMOBLA01"
              value={curp}
              onChangeText={(val) => setCurp(val.toUpperCase())}
              maxLength={18}
              autoCapitalize="characters"
            />
            {curp !== "" && curp.length !== 18 && (
              <Text style={styles.errorTextInline}>
                El CURP debe contener exactamente 18 caracteres.
              </Text>
            )}

            {errora ? <Text style={styles.error}>{errora}</Text> : null}
            
            <View style={{ marginTop: 10 }}>
              <Button
                title={loading ? "Verificando..." : "Verificar CURP"}
                onPress={verificarCurp}
                color="#000684"
                disabled={loading}
              />
            </View>

            {mensaje ? <Text style={styles.infoBanner}>{mensaje}</Text> : null}
            
            <TouchableOpacity 
              style={{ marginTop: 20 }}
              onPress={() => {
                setDatosObtenidos(true);
                setEsPacienteExistente(false);
                setMensaje("Registro manual de usuario");
                setError("");
              }}
            >
              <Text style={styles.linkText}>¿No tienes CURP a la mano? Continuar registro manual</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formContainerCenter}>
            {mensaje ? (
              <Text style={esPacienteExistente ? styles.successBanner : styles.infoBanner}>
                {mensaje}
              </Text>
            ) : null}

            <View style={styles.formCard}>
              <Text style={styles.fieldLabel}>CURP *:</Text>
              <TextInput
                style={styles.input}
                value={input.curp}
                onChangeText={(val) => setInput({ ...input, curp: val.toUpperCase() })}
                placeholder="CURP"
                maxLength={18}
                autoCapitalize="characters"
              />

              <Text style={styles.fieldLabel}>Nombre *:</Text>
              <TextInput
                style={styles.input}
                value={input.nombre}
                onChangeText={(val) => setInput({ ...input, nombre: limpiaSoloLetras(val) })}
                placeholder="Tu Nombre"
                editable={!esPacienteExistente || !input.nombre}
              />

              <Text style={styles.fieldLabel}>Apellido Paterno *:</Text>
              <TextInput
                style={styles.input}
                value={input.apellidoPaterno}
                onChangeText={(val) => setInput({ ...input, apellidoPaterno: limpiaSoloLetras(val) })}
                placeholder="Apellido Paterno"
                editable={!esPacienteExistente || !input.apellidoPaterno}
              />

              <Text style={styles.fieldLabel}>Apellido Materno:</Text>
              <TextInput
                style={styles.input}
                value={input.apellidoMaterno}
                onChangeText={(val) => setInput({ ...input, apellidoMaterno: limpiaSoloLetras(val) })}
                placeholder="Apellido Materno"
                editable={!esPacienteExistente || !input.apellidoMaterno}
              />

              <Text style={styles.fieldLabel}>Fecha de Nacimiento *:</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setModalFechaVisible(true)}
              >
                <MaterialIcons name="calendar-today" size={20} color="#000684" style={{ marginRight: 10 }} />
                <Text style={styles.datePickerText}>
                  {input.fechaNacimiento ? input.fechaNacimiento : "Toca aquí para seleccionar fecha"}
                </Text>
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>Estado / Entidad Federativa de Nacimiento *:</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={input.entidadFederativaNacimiento}
                  onValueChange={(itemValue) => setInput({ ...input, entidadFederativaNacimiento: itemValue })}
                  style={styles.picker}
                >
                  {ESTADOS_MEXICO.map((estado, idx) => (
                    <Picker.Item key={idx} label={estado} value={estado} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.fieldLabel}>Sexo *:</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={input.sexo}
                  onValueChange={(itemValue) => setInput({ ...input, sexo: itemValue })}
                  style={styles.picker}
                >
                  <Picker.Item label="Hombre" value="Hombre" />
                  <Picker.Item label="Mujer" value="Mujer" />
                </Picker>
              </View>

              <Text style={styles.fieldLabel}>Correo Electrónico *:</Text>
              <TextInput
                style={styles.input}
                placeholder="correo@ejemplo.com"
                value={input.email}
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={(val) => setInput({ ...input, email: val })}
              />

              <Text style={styles.fieldLabel}>Nombre de Usuario *:</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre de Usuario"
                autoCapitalize="none"
                value={input.username}
                onChangeText={(val) => setInput({ ...input, username: val })}
              />

              <Text style={styles.fieldLabel}>Contraseña *:</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.inputPassword}
                  placeholder="Contraseña (>6 caracteres)"
                  secureTextEntry={!mostrarPassword}
                  value={input.password}
                  onChangeText={(val) => setInput({ ...input, password: val })}
                />
                <TouchableOpacity onPress={() => setMostrarPassword(!mostrarPassword)} style={styles.eyeIcon}>
                  <Ionicons name={mostrarPassword ? "eye" : "eye-off"} size={22} color="#666" />
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>Confirmar Contraseña *:</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.inputPassword}
                  placeholder="Repite tu contraseña"
                  secureTextEntry={!mostrarConfirmPassword}
                  value={confirmPassword}
                  onChangeText={(val) => setConfirmPassword(val)}
                />
                <TouchableOpacity onPress={() => setMostrarConfirmPassword(!mostrarConfirmPassword)} style={styles.eyeIcon}>
                  <Ionicons name={mostrarConfirmPassword ? "eye" : "eye-off"} size={22} color="#666" />
                </TouchableOpacity>
              </View>

              {errora ? <Text style={styles.error}>{errora}</Text> : null}

              <View style={{ marginTop: 20 }}>
                <Button
                  title="Crear Cuenta"
                  onPress={handleCrearUsuario}
                  color="#000684"
                />
              </View>

              <TouchableOpacity 
                style={{ marginTop: 18 }} 
                onPress={() => {
                  setDatosObtenidos(false);
                  setHasSubmitted(false);
                  setMensaje("");
                  setError("");
                }}
              >
                <Text style={styles.linkText}>Volver a verificar CURP</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  imglogo: {
    width: 130,
    height: 65,
    marginTop: 40,
    marginBottom: 10,
  },
  formContainerCenter: {
    paddingHorizontal: 25,
    marginTop: 10,
  },
  subtituloText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000684",
    textAlign: "center",
    marginBottom: 20,
  },
  fieldLabel: {
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    height: 44,
    borderColor: "#CCC",
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 10,
    paddingHorizontal: 12,
    backgroundColor: "#FAFAFA",
    fontSize: 14,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderColor: "#CCC",
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 10,
    paddingHorizontal: 12,
    backgroundColor: "#FAFAFA",
  },
  datePickerText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  pickerContainer: {
    borderColor: "#CCC",
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 10,
    backgroundColor: "#FAFAFA",
    overflow: "hidden",
  },
  picker: {
    height: 44,
    width: "100%",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#CCC",
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 10,
    backgroundColor: "#FAFAFA",
  },
  inputPassword: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  eyeIcon: {
    paddingHorizontal: 12,
  },
  formCard: {
    width: "100%",
  },
  error: {
    color: "red",
    marginVertical: 10,
    textAlign: "center",
    fontWeight: "600",
  },
  errorTextInline: {
    color: "red",
    fontSize: 12,
    marginBottom: 10,
  },
  infoBanner: {
    backgroundColor: "#E8F4FD",
    color: "#0056BD",
    padding: 12,
    borderRadius: 6,
    marginVertical: 12,
    textAlign: "center",
    fontSize: 13,
  },
  successBanner: {
    backgroundColor: "#E6F4EA",
    color: "#137333",
    padding: 12,
    borderRadius: 6,
    marginVertical: 12,
    textAlign: "center",
    fontSize: 13,
  },
  linkText: {
    color: "#0056BD",
    textAlign: "center",
    textDecorationLine: "underline",
    fontSize: 14,
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
    padding: 28,
    width: "90%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalCardDatePicker: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    width: "95%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitlePicker: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#000684",
    marginBottom: 10,
    textAlign: "center",
  },
  livePreviewCard: {
    backgroundColor: "#E8F4FD",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
    width: "100%",
    borderColor: "#BBE0FF",
    borderWidth: 1,
  },
  livePreviewLabel: {
    fontSize: 11,
    color: "#0056BD",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  livePreviewValue: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#000684",
    marginTop: 2,
  },
  livePreviewSub: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
  },
  pickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  pickerCol: {
    flex: 1,
    marginHorizontal: 2,
    borderColor: "#DDD",
    borderWidth: 1,
    borderRadius: 6,
    backgroundColor: "#F9F9F9",
    alignItems: "center",
  },
  pickerLabelHeader: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000684",
    marginTop: 6,
  },
  pickerMini: {
    height: 40,
    width: "100%",
  },
  exitoTitulo: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#137333",
    marginBottom: 10,
    textAlign: "center",
  },
  exitoSubtitulo: {
    fontSize: 15,
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 22,
  },
  exitoDetalle: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
});

export default CrearCuenta;

