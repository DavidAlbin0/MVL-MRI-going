import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { gql, useMutation, useLazyQuery } from "@apollo/client";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

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
  return texto ? texto.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "") : "";
};

const extraeFechaDeCurp = (curpStr) => {
  if (curpStr && curpStr.length >= 10) {
    const aa = curpStr.substring(4, 6);
    const mm = curpStr.substring(6, 8);
    const dd = curpStr.substring(8, 10);
    const anio = parseInt(aa, 10) > 30 ? `19${aa}` : `20${aa}`;
    const fecha = `${anio}-${mm}-${dd}`;
    if (!isNaN(Date.parse(fecha))) {
      return { fecha, anio, mes: mm, dia: dd };
    }
  }
  return { fecha: "1995-05-15", anio: "1995", mes: "05", dia: "15" };
};

const extraeSexoDeCurp = (curpStr) => {
  if (curpStr && curpStr.length >= 11) {
    const s = curpStr.charAt(10).toUpperCase();
    return s === "M" ? "Mujer" : "Hombre";
  }
  return "Hombre";
};

const CrearCuenta = () => {
  const navigation = useNavigation();

  // Paso del flujo (1 = Consulta de CURP, 2 = Formulario completo)
  const [paso, setPaso] = useState(1);
  const [curpInput, setCurpInput] = useState("");
  const [errorCurp, setErrorCurp] = useState("");
  const [errorForm, setErrorForm] = useState("");

  // Modal informativo para cuando el CURP NO está en MRI
  const [modalNoEncontrado, setModalNoEncontrado] = useState(false);
  const [esPacienteEncontrado, setEsPacienteEncontrado] = useState(false);
  const [cuentaCreadaExitosa, setCuentaCreadaExitosa] = useState(false);

  // Selector de fecha
  const [modalFechaVisible, setModalFechaVisible] = useState(false);
  const [diaSel, setDiaSel] = useState("15");
  const [mesSel, setMesSel] = useState("05");
  const [anioSel, setAnioSel] = useState("1995");

  // Campos de formulario
  const [input, setInput] = useState({
    curp: "",
    email: "",
    username: "",
    password: "",
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    fechaNacimiento: "1995-05-15",
    entidadFederativaNacimiento: "Morelos",
    sexo: "Hombre",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirm, setMostrarConfirm] = useState(false);

  // GraphQL
  const [creacionPorCurp, { loading: validandoCurp }] = useLazyQuery(CREACION_POR_CURP, {
    fetchPolicy: "network-only",
  });
  const [crearUsuario, { loading: guardandoUsuario }] = useMutation(CREAR_USUARIO);

  // Actualizar selector de fecha
  const updateFechaLive = (d, m, a) => {
    setDiaSel(d);
    setMesSel(m);
    setAnioSel(a);
    setInput((prev) => ({ ...prev, fechaNacimiento: `${a}-${m}-${d}` }));
  };

  // PASO 1: Validar CURP
  const handleConsultarCurp = async () => {
    setErrorCurp("");
    const curpLimpio = curpInput.trim().toUpperCase();

    if (curpLimpio.length !== 18) {
      setErrorCurp("El CURP debe contener exactamente 18 caracteres.");
      return;
    }

    if (!REGEX_CURP.test(curpLimpio)) {
      setErrorCurp("El formato del CURP no es válido. Verifica las letras y números.");
      return;
    }

    try {
      const { data } = await creacionPorCurp({ variables: { curp: curpLimpio } });

      if (data && data.creacionPorCurp) {
        // Caso A: Paciente encontrado con expediente en MRI
        const pac = data.creacionPorCurp;
        setEsPacienteEncontrado(true);

        const fechaObj = extraeFechaDeCurp(pac.curp || curpLimpio);
        setDiaSel(fechaObj.dia);
        setMesSel(fechaObj.mes);
        setAnioSel(fechaObj.anio);

        setInput((prev) => ({
          ...prev,
          curp: pac.curp || curpLimpio,
          nombre: limpiaSoloLetras(pac.nombre_pac || ""),
          apellidoPaterno: limpiaSoloLetras(pac.apat_Pac || ""),
          apellidoMaterno: limpiaSoloLetras(pac.amat_Pac || ""),
          fechaNacimiento: pac.fecnac_Pac || fechaObj.fecha,
          sexo: pac.sexo_Pac === "F" || pac.sexo_Pac === "Mujer" ? "Mujer" : "Hombre",
          entidadFederativaNacimiento: pac.entidad_nacimiento || "Morelos",
          email: pac.correo_Pac || prev.email,
        }));

        setPaso(2);
      } else {
        // Caso B: Paciente NO encontrado en MRI -> Mostrar mensaje explicativo
        setEsPacienteEncontrado(false);
        const fechaObj = extraeFechaDeCurp(curpLimpio);
        setDiaSel(fechaObj.dia);
        setMesSel(fechaObj.mes);
        setAnioSel(fechaObj.anio);

        setInput((prev) => ({
          ...prev,
          curp: curpLimpio,
          fechaNacimiento: fechaObj.fecha,
          sexo: extraeSexoDeCurp(curpLimpio),
        }));

        setModalNoEncontrado(true);
      }
    } catch (err) {
      console.log("Error al consultar CURP:", err);
      // Si ocurre error de red o similar, permitimos continuar
      setEsPacienteEncontrado(false);
      setInput((prev) => ({ ...prev, curp: curpLimpio }));
      setModalNoEncontrado(true);
    }
  };

  // PASO 2: Confirmar y crear usuario
  const handleCrearUsuario = async () => {
    setErrorForm("");
    const emailTrim = (input.email || "").trim().toLowerCase();
    const passTrim = (input.password || "").trim();
    const confirmPassTrim = (confirmPassword || "").trim();
    const userTrim = (input.username || "").trim();
    const nombreTrim = limpiaSoloLetras(input.nombre || "").trim();
    const apatTrim = limpiaSoloLetras(input.apellidoPaterno || "").trim();
    const amatTrim = limpiaSoloLetras(input.apellidoMaterno || "").trim();
    const curpTrim = (input.curp || curpInput || "").trim().toUpperCase();

    if (!nombreTrim || !apatTrim || !userTrim || !emailTrim || !passTrim) {
      setErrorForm("Por favor completa todos los campos requeridos (*).");
      return;
    }

    if (!REGEX_EMAIL.test(emailTrim)) {
      setErrorForm("El formato de correo electrónico no es válido.");
      return;
    }

    if (passTrim.length < 6) {
      setErrorForm("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (passTrim !== confirmPassTrim) {
      setErrorForm("Las contraseñas no coinciden. Por favor verifícalas.");
      return;
    }

    try {
      const payload = {
        curp: curpTrim,
        nombre: nombreTrim,
        apellidoPaterno: apatTrim,
        apellidoMaterno: amatTrim,
        username: userTrim,
        email: emailTrim,
        password: passTrim,
        fechaNacimiento: input.fechaNacimiento,
        entidadFederativaNacimiento: input.entidadFederativaNacimiento,
        sexo: input.sexo,
      };

      const { data } = await crearUsuario({
        variables: { input: payload },
      });

      if (data && data.crearUsuario) {
        setCuentaCreadaExitosa(true);
      }
    } catch (err) {
      console.error("Error al crear cuenta:", err);
      const msg = err.graphQLErrors?.[0]?.message || err.message;
      if (msg && msg.toLowerCase().includes("registrado")) {
        setErrorForm("Este correo o CURP ya tiene una cuenta registrada. Intenta iniciar sesión.");
      } else {
        setErrorForm(msg || "No se pudo registrar la cuenta. Verifica que los datos no estén duplicados.");
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000684" />

      {/* HEADER SUPERIOR CON BOTÓN DE REGRESO */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (paso === 2) {
              setPaso(1);
            } else {
              navigation.goBack();
            }
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.topHeaderTitle}>Crear Cuenta</Text>
          <Text style={styles.topHeaderSub}>
            {paso === 1 ? "Paso 1: Validación de CURP" : "Paso 2: Datos de Registro"}
          </Text>
        </View>
      </View>

      {/* MODAL 1: AVISO CUANDO EL CURP NO ESTÁ EN MRI */}
      <Modal visible={modalNoEncontrado} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIconBox, { backgroundColor: "#EFF6FF" }]}>
              <Ionicons name="information-circle" size={48} color="#0056BD" />
            </View>
            <Text style={styles.modalCardTitle}>Aún no estás en Imagen Médica MRI</Text>
            <Text style={styles.modalCardBody}>
              No encontramos un expediente previo vinculado a este CURP en nuestro sistema clínico.
            </Text>
            <View style={styles.modalNoteBox}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#000684" style={{ marginRight: 6 }} />
              <Text style={styles.modalNoteText}>
                ¡Puedes crear tu cuenta ahora mismo! En cuanto te realices un estudio en cualquiera de nuestras sucursales, tus resultados, imágenes y recetas aparecerán automáticamente vinculados a tu cuenta.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => {
                setModalNoEncontrado(false);
                setPaso(2);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.modalPrimaryBtnText}>Continuar con mi Registro</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalSecondaryBtn}
              onPress={() => setModalNoEncontrado(false)}
            >
              <Text style={styles.modalSecondaryBtnText}>Corregir CURP</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: ÉXITO AL REGISTRAR CUENTA */}
      <Modal visible={cuentaCreadaExitosa} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIconBox, { backgroundColor: "#F0FDF4" }]}>
              <Ionicons name="checkmark-circle" size={54} color="#15803D" />
            </View>
            <Text style={styles.modalCardTitle}>¡Cuenta Creada Exitosamente!</Text>
            <Text style={styles.modalCardBody}>
              Tu cuenta ha quedado registrada en Imagen Médica MRI. Ahora puedes iniciar sesión con tu correo y contraseña.
            </Text>
            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => {
                setCuentaCreadaExitosa(false);
                navigation.navigate("Configuracion");
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.modalPrimaryBtnText}>Iniciar Sesión Ahora</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: SELECTOR DE FECHA DE NACIMIENTO */}
      <Modal visible={modalFechaVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalDatePickerCard}>
            <View style={styles.modalPickerHeader}>
              <Text style={styles.modalPickerTitle}>Fecha de Nacimiento</Text>
              <TouchableOpacity onPress={() => setModalFechaVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.liveDatePreview}>
              <Text style={styles.liveDateLabel}>Selección actual:</Text>
              <Text style={styles.liveDateValue}>
                {diaSel} de {MESES.find((m) => m.value === mesSel)?.label.split(" ")[0]} de {anioSel}
              </Text>
            </View>

            <View style={styles.pickerRow}>
              <View style={styles.pickerCol}>
                <Text style={styles.pickerColLabel}>Día</Text>
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

              <View style={[styles.pickerCol, { flex: 1.4 }]}>
                <Text style={styles.pickerColLabel}>Mes</Text>
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
                <Text style={styles.pickerColLabel}>Año</Text>
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

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => setModalFechaVisible(false)}
            >
              <Text style={styles.modalPrimaryBtnText}>Confirmar Fecha</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* INDICADOR DE PASOS */}
        <View style={styles.stepsRow}>
          <View style={[styles.stepDot, paso >= 1 && styles.stepDotActive]}>
            <Text style={[styles.stepDotText, paso >= 1 && styles.stepDotTextActive]}>1</Text>
          </View>
          <View style={[styles.stepLine, paso === 2 && styles.stepLineActive]} />
          <View style={[styles.stepDot, paso === 2 && styles.stepDotActive]}>
            <Text style={[styles.stepDotText, paso === 2 && styles.stepDotTextActive]}>2</Text>
          </View>
        </View>

        {paso === 1 ? (
          /* ================= PASO 1: VERIFICAR CURP ================= */
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconCircle, { backgroundColor: "#EEF2FF" }]}>
                <Ionicons name="finger-print" size={24} color="#000684" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Identificación del Paciente</Text>
                <Text style={styles.cardSubtitle}>
                  Ingresa tu CURP para vincular tu historial médico o comenzar tu registro.
                </Text>
              </View>
            </View>

            <Text style={styles.inputLabel}>Clave CURP (18 caracteres) *</Text>
            <View style={styles.inputBox}>
              <Ionicons name="card-outline" size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { fontFamily: "monospace" }]}
                placeholder="Ej. ALGD981010HMOBLA01"
                placeholderTextColor="#94A3B8"
                value={curpInput}
                onChangeText={(val) => {
                  setCurpInput(val.toUpperCase());
                  if (errorCurp) setErrorCurp("");
                }}
                maxLength={18}
                autoCapitalize="characters"
              />
              <Text style={styles.charCount}>{curpInput.length}/18</Text>
            </View>

            {errorCurp ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color="#DC2626" style={{ marginRight: 8 }} />
                <Text style={styles.errorText}>{errorCurp}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryButton, validandoCurp && styles.buttonDisabled]}
              onPress={handleConsultarCurp}
              disabled={validandoCurp}
              activeOpacity={0.85}
            >
              {validandoCurp ? (
                <View style={styles.btnLoadingRow}>
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryButtonText}>Consultando expedientes...</Text>
                </View>
              ) : (
                <View style={styles.btnLoadingRow}>
                  <Ionicons name="search" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryButtonText}>Consultar y Continuar</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.curpInfoNote}>
              <Ionicons name="shield-checkmark" size={18} color="#15803D" style={{ marginRight: 8, marginTop: 1 }} />
              <Text style={styles.curpInfoText}>
                Si ya te has realizado estudios en Imagen Médica MRI, tus resultados se sincronizarán al verificar tu CURP.
              </Text>
            </View>
          </View>
        ) : (
          /* ================= PASO 2: FORMULARIO DE REGISTRO ================= */
          <View>
            {/* BADGE DE CURP VALIDADO */}
            <View style={styles.curpValidatedCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.curpValidatedLabel}>CURP VINCULADO</Text>
                <Text style={styles.curpValidatedValue}>{input.curp}</Text>
                {esPacienteEncontrado ? (
                  <View style={styles.badgeFound}>
                    <Ionicons name="checkmark-circle" size={12} color="#15803D" style={{ marginRight: 4 }} />
                    <Text style={styles.badgeFoundText}>Expediente Encontrado en MRI</Text>
                  </View>
                ) : (
                  <View style={[styles.badgeFound, { backgroundColor: "#EFF6FF" }]}>
                    <Ionicons name="person-add" size={12} color="#0056BD" style={{ marginRight: 4 }} />
                    <Text style={[styles.badgeFoundText, { color: "#0056BD" }]}>Nuevo Paciente</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.btnChangeCurp}
                onPress={() => setPaso(1)}
              >
                <Text style={styles.btnChangeCurpText}>Cambiar</Text>
              </TouchableOpacity>
            </View>

            {/* SECCIÓN 1: DATOS PERSONALES */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>1. Datos Personales</Text>

              <Text style={styles.inputLabel}>Nombre(s) *</Text>
              <View style={styles.inputBox}>
                <Ionicons name="person-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Ej. David"
                  placeholderTextColor="#94A3B8"
                  value={input.nombre}
                  onChangeText={(val) => setInput({ ...input, nombre: limpiaSoloLetras(val) })}
                />
              </View>

              <View style={styles.rowTwoInputs}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Primer Apellido *</Text>
                  <View style={styles.inputBox}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Paterno"
                      placeholderTextColor="#94A3B8"
                      value={input.apellidoPaterno}
                      onChangeText={(val) => setInput({ ...input, apellidoPaterno: limpiaSoloLetras(val) })}
                    />
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Segundo Apellido</Text>
                  <View style={styles.inputBox}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Materno"
                      placeholderTextColor="#94A3B8"
                      value={input.apellidoMaterno}
                      onChangeText={(val) => setInput({ ...input, apellidoMaterno: limpiaSoloLetras(val) })}
                    />
                  </View>
                </View>
              </View>

              {/* SELECTOR DE SEXO */}
              <Text style={styles.inputLabel}>Sexo Biológico *</Text>
              <View style={styles.sexoSelectorRow}>
                <TouchableOpacity
                  style={[styles.sexoBtn, input.sexo === "Hombre" && styles.sexoBtnActive]}
                  onPress={() => setInput({ ...input, sexo: "Hombre" })}
                >
                  <Ionicons name="male" size={18} color={input.sexo === "Hombre" ? "#000684" : "#64748B"} style={{ marginRight: 6 }} />
                  <Text style={[styles.sexoBtnText, input.sexo === "Hombre" && styles.sexoBtnTextActive]}>Hombre</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sexoBtn, input.sexo === "Mujer" && styles.sexoBtnActive]}
                  onPress={() => setInput({ ...input, sexo: "Mujer" })}
                >
                  <Ionicons name="female" size={18} color={input.sexo === "Mujer" ? "#000684" : "#64748B"} style={{ marginRight: 6 }} />
                  <Text style={[styles.sexoBtnText, input.sexo === "Mujer" && styles.sexoBtnTextActive]}>Mujer</Text>
                </TouchableOpacity>
              </View>

              {/* FECHA DE NACIMIENTO */}
              <Text style={styles.inputLabel}>Fecha de Nacimiento *</Text>
              <TouchableOpacity
                style={styles.dateSelectorBtn}
                onPress={() => setModalFechaVisible(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#000684" style={{ marginRight: 10 }} />
                <Text style={styles.dateSelectorText}>{input.fechaNacimiento}</Text>
                <Ionicons name="create-outline" size={18} color="#64748B" style={{ marginLeft: "auto" }} />
              </TouchableOpacity>

              {/* ENTIDAD FEDERATIVA */}
              <Text style={styles.inputLabel}>Lugar de Nacimiento</Text>
              <View style={styles.pickerBox}>
                <Picker
                  selectedValue={input.entidadFederativaNacimiento}
                  onValueChange={(val) => setInput({ ...input, entidadFederativaNacimiento: val })}
                  style={styles.pickerFull}
                >
                  {ESTADOS_MEXICO.map((edo) => (
                    <Picker.Item key={edo} label={edo} value={edo} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* SECCIÓN 2: CREDENCIALES DE ACCESO */}
            <View style={[styles.card, { marginTop: 14 }]}>
              <Text style={styles.sectionTitle}>2. Credenciales del Portal</Text>

              <Text style={styles.inputLabel}>Nombre de Usuario *</Text>
              <View style={styles.inputBox}>
                <Ionicons name="at" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Ej. david98"
                  placeholderTextColor="#94A3B8"
                  value={input.username}
                  onChangeText={(val) => setInput({ ...input, username: val.toLowerCase().replace(/\s/g, "") })}
                  autoCapitalize="none"
                />
              </View>

              <Text style={styles.inputLabel}>Correo Electrónico *</Text>
              <View style={styles.inputBox}>
                <Ionicons name="mail-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="ejemplo@correo.com"
                  placeholderTextColor="#94A3B8"
                  value={input.email}
                  onChangeText={(val) => setInput({ ...input, email: val })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <Text style={styles.inputLabel}>Contraseña * (mínimo 6 caracteres)</Text>
              <View style={styles.inputBox}>
                <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Crea tu contraseña"
                  placeholderTextColor="#94A3B8"
                  value={input.password}
                  onChangeText={(val) => setInput({ ...input, password: val })}
                  secureTextEntry={!mostrarPassword}
                />
                <TouchableOpacity onPress={() => setMostrarPassword(!mostrarPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name={mostrarPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Confirmar Contraseña *</Text>
              <View style={styles.inputBox}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Repite tu contraseña"
                  placeholderTextColor="#94A3B8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!mostrarConfirm}
                />
                <TouchableOpacity onPress={() => setMostrarConfirm(!mostrarConfirm)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name={mostrarConfirm ? "eye-off-outline" : "eye-outline"} size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              {errorForm ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color="#DC2626" style={{ marginRight: 8 }} />
                  <Text style={styles.errorText}>{errorForm}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.primaryButton, guardandoUsuario && styles.buttonDisabled]}
                onPress={handleCrearUsuario}
                disabled={guardandoUsuario}
                activeOpacity={0.85}
              >
                {guardandoUsuario ? (
                  <View style={styles.btnLoadingRow}>
                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryButtonText}>Registrando paciente...</Text>
                  </View>
                ) : (
                  <View style={styles.btnLoadingRow}>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryButtonText}>Registrar mi Cuenta</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 12,
  },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  stepDotActive: {
    backgroundColor: "#000684",
  },
  stepDotText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#64748B",
  },
  stepDotTextActive: {
    color: "#FFFFFF",
  },
  stepLine: {
    width: 60,
    height: 3,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: "#000684",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0F172A",
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#000684",
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 5,
    marginTop: 10,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
  },
  charCount: {
    fontSize: 11,
    color: "#94A3B8",
    fontFamily: "monospace",
  },
  rowTwoInputs: {
    flexDirection: "row",
  },
  sexoSelectorRow: {
    flexDirection: "row",
    gap: 10,
  },
  sexoBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  sexoBtnActive: {
    borderColor: "#000684",
    backgroundColor: "#EEF2FF",
  },
  sexoBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  sexoBtnTextActive: {
    color: "#000684",
    fontWeight: "bold",
  },
  dateSelectorBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  dateSelectorText: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "600",
  },
  pickerBox: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    overflow: "hidden",
  },
  pickerFull: {
    height: 50,
    width: "100%",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: "#DC2626",
    lineHeight: 16,
  },
  primaryButton: {
    backgroundColor: "#000684",
    borderRadius: 12,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  btnLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  curpInfoNote: {
    flexDirection: "row",
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    alignItems: "flex-start",
  },
  curpInfoText: {
    flex: 1,
    fontSize: 12,
    color: "#166534",
    lineHeight: 17,
  },
  curpValidatedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    borderLeftWidth: 4,
    borderLeftColor: "#000684",
  },
  curpValidatedLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.6,
  },
  curpValidatedValue: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0F172A",
    fontFamily: "monospace",
    marginTop: 2,
  },
  badgeFound: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  badgeFoundText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#15803D",
  },
  btnChangeCurp: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  btnChangeCurpText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 6, 132, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  modalIconBox: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  modalCardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 8,
  },
  modalCardBody: {
    fontSize: 13,
    color: "#475569",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 14,
  },
  modalNoteBox: {
    flexDirection: "row",
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    alignItems: "flex-start",
  },
  modalNoteText: {
    flex: 1,
    fontSize: 11,
    color: "#1E1B4B",
    lineHeight: 16,
  },
  modalPrimaryBtn: {
    backgroundColor: "#000684",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: "100%",
    alignItems: "center",
  },
  modalPrimaryBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  modalSecondaryBtn: {
    paddingVertical: 10,
    marginTop: 8,
  },
  modalSecondaryBtnText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },
  modalDatePickerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 20,
    width: "100%",
    maxWidth: 350,
  },
  modalPickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalPickerTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#0F172A",
  },
  liveDatePreview: {
    backgroundColor: "#EEF2FF",
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    alignItems: "center",
  },
  liveDateLabel: {
    fontSize: 11,
    color: "#6366F1",
    fontWeight: "600",
  },
  liveDateValue: {
    fontSize: 14,
    color: "#000684",
    fontWeight: "bold",
    marginTop: 2,
  },
  pickerRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  pickerCol: {
    flex: 1,
    marginHorizontal: 3,
  },
  pickerColLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    textAlign: "center",
    marginBottom: 4,
  },
  pickerMini: {
    height: 120,
    backgroundColor: "#F8FAFC",
  },
});

export default CrearCuenta;
