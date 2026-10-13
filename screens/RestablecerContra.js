import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { gql, useMutation, useLazyQuery } from '@apollo/client';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const VERIFICAR_USUARIO = gql`
  query VerificarUsuarioRecuperacion($curp: String!, $email: String!) {
    verificarUsuarioRecuperacion(curp: $curp, email: $email) {
      curp
      email
      username
      nombre
      apellidoPaterno
      apellidoMaterno
    }
  }
`;

const ACTUALIZAR_CONTRASENA = gql`
  mutation ActualizarContrasena($curp: String!, $email: String!, $nuevaContrasena: String!) {
    actualizarContrasena(curp: $curp, email: $email, nuevaContrasena: $nuevaContrasena)
  }
`;

const RestablecerContra = () => {
  const navigation = useNavigation();

  // Estados del formulario
  const [curp, setCurp] = useState('');
  const [email, setEmail] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirm, setMostrarConfirm] = useState(false);

  // Estados de flujo y validación
  const [paso, setPaso] = useState(1); // 1 = Localizar cuenta, 2 = Nueva contraseña
  const [usuarioEncontrado, setUsuarioEncontrado] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [modalExito, setModalExito] = useState(false);

  // Queries y Mutaciones
  const [verificarUsuario, { loading: buscandoUsuario }] = useLazyQuery(VERIFICAR_USUARIO, {
    fetchPolicy: 'network-only',
  });
  const [actualizarContrasena, { loading: guardandoPassword }] = useMutation(ACTUALIZAR_CONTRASENA);

  // Manejador del Paso 1: Buscar cuenta
  const handleBuscarCuenta = async () => {
    setErrorMsg('');
    const curpLimpio = curp.trim().toUpperCase();
    const emailLimpio = email.trim().toLowerCase();

    if (!curpLimpio || !emailLimpio) {
      setErrorMsg('Por favor ingresa tanto tu CURP como tu correo electrónico.');
      return;
    }

    if (curpLimpio.length !== 18) {
      setErrorMsg('El CURP debe contener exactamente 18 caracteres.');
      return;
    }

    try {
      const { data } = await verificarUsuario({
        variables: { curp: curpLimpio, email: emailLimpio },
      });

      if (data && data.verificarUsuarioRecuperacion) {
        setUsuarioEncontrado(data.verificarUsuarioRecuperacion);
        setPaso(2);
      } else {
        setErrorMsg('No encontramos ninguna cuenta registrada con estos datos.');
      }
    } catch (err) {
      setErrorMsg('No se encontró ninguna cuenta registrada que coincida con ese CURP y correo electrónico.');
    }
  };

  // Manejador del Paso 2: Guardar nueva contraseña
  const handleCambiarContrasena = async () => {
    setErrorMsg('');
    const pass = nuevaContrasena.trim();
    const confirm = confirmarContrasena.trim();

    if (!pass || !confirm) {
      setErrorMsg('Por favor completa ambos campos de contraseña.');
      return;
    }

    if (pass.length < 6) {
      setErrorMsg('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (pass !== confirm) {
      setErrorMsg('Las contraseñas ingresadas no coinciden.');
      return;
    }

    try {
      await actualizarContrasena({
        variables: {
          curp: curp.trim().toUpperCase(),
          email: email.trim().toLowerCase(),
          nuevaContrasena: pass,
        },
      });

      setModalExito(true);
    } catch (err) {
      setErrorMsg('Hubo un error al actualizar la contraseña. Inténtalo nuevamente.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000684" />

      {/* HEADER SUPERIOR */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.topHeaderTitle}>Recuperar Contraseña</Text>
          <Text style={styles.topHeaderSub}>
            {paso === 1 ? 'Paso 1: Localiza tu cuenta' : 'Paso 2: Define tu nueva clave'}
          </Text>
        </View>
      </View>

      {/* MODAL DE ÉXITO */}
      <Modal visible={modalExito} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalSuccessIcon}>
              <Ionicons name="checkmark-circle" size={60} color="#137333" />
            </View>
            <Text style={styles.modalSuccessTitle}>¡Contraseña Actualizada!</Text>
            <Text style={styles.modalSuccessText}>
              Tu contraseña ha sido restablecida exitosamente. Ya puedes ingresar al portal de pacientes con tu nueva clave.
            </Text>
            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => {
                setModalExito(false);
                navigation.navigate('Configuracion');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.modalPrimaryBtnText}>Ir a Iniciar Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* INDICADOR DE PASOS */}
        <View style={styles.stepsIndicatorRow}>
          <View style={[styles.stepDot, paso >= 1 && styles.stepDotActive]}>
            <Text style={[styles.stepDotText, paso >= 1 && styles.stepDotTextActive]}>1</Text>
          </View>
          <View style={[styles.stepLine, paso === 2 && styles.stepLineActive]} />
          <View style={[styles.stepDot, paso === 2 && styles.stepDotActive]}>
            <Text style={[styles.stepDotText, paso === 2 && styles.stepDotTextActive]}>2</Text>
          </View>
        </View>

        {paso === 1 ? (
          /* ================= PASO 1: LOCALIZAR CUENTA ================= */
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconCircle, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="search" size={22} color="#000684" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Localiza tu Expediente</Text>
                <Text style={styles.cardSubtitle}>
                  Ingresa tu CURP y correo registrado en Imagen Médica MRI.
                </Text>
              </View>
            </View>

            {/* CAMPO CURP */}
            <Text style={styles.inputLabel}>CURP (18 caracteres)</Text>
            <View style={styles.inputBox}>
              <Ionicons name="finger-print-outline" size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Ej. ALGD981010HMOBLA01"
                placeholderTextColor="#94A3B8"
                value={curp}
                onChangeText={(val) => {
                  setCurp(val.toUpperCase());
                  if (errorMsg) setErrorMsg('');
                }}
                maxLength={18}
                autoCapitalize="characters"
              />
            </View>

            {/* CAMPO EMAIL */}
            <Text style={styles.inputLabel}>Correo Electrónico Registrado</Text>
            <View style={styles.inputBox}>
              <Ionicons name="mail-outline" size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="ejemplo@correo.com"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  if (errorMsg) setErrorMsg('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* MENSAJE DE ERROR */}
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color="#DC2626" style={{ marginRight: 8 }} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* BOTÓN BUSCAR */}
            <TouchableOpacity
              style={[styles.primaryButton, buscandoUsuario && styles.buttonDisabled]}
              onPress={handleBuscarCuenta}
              disabled={buscandoUsuario}
              activeOpacity={0.85}
            >
              {buscandoUsuario ? (
                <View style={styles.btnLoadingRow}>
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryButtonText}>Verificando en registros...</Text>
                </View>
              ) : (
                <View style={styles.btnLoadingRow}>
                  <Ionicons name="search" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryButtonText}>Buscar mi Cuenta</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* ================= PASO 2: NUEVA CONTRASEÑA ================= */
          <View style={styles.card}>
            {/* TARJETA DE USUARIO CONFIRMADO */}
            <View style={styles.userFoundBanner}>
              <Ionicons name="checkmark-circle" size={24} color="#137333" style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.userFoundTitle}>¡Cuenta Verificada!</Text>
                <Text style={styles.userFoundName}>
                  {usuarioEncontrado?.nombre} {usuarioEncontrado?.apellidoPaterno}
                </Text>
                <Text style={styles.userFoundDetails}>
                  Usuario: @{usuarioEncontrado?.username} • CURP: {usuarioEncontrado?.curp}
                </Text>
              </View>
            </View>

            <View style={[styles.cardHeader, { marginTop: 10 }]}>
              <View style={[styles.iconCircle, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="key" size={22} color="#15803D" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Crea tu Nueva Contraseña</Text>
                <Text style={styles.cardSubtitle}>Mínimo 6 caracteres para mayor seguridad</Text>
              </View>
            </View>

            {/* NUEVA CONTRASEÑA */}
            <Text style={styles.inputLabel}>Nueva Contraseña</Text>
            <View style={styles.inputBox}>
              <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Ingresa tu nueva contraseña"
                placeholderTextColor="#94A3B8"
                value={nuevaContrasena}
                onChangeText={(val) => {
                  setNuevaContrasena(val);
                  if (errorMsg) setErrorMsg('');
                }}
                secureTextEntry={!mostrarPassword}
              />
              <TouchableOpacity onPress={() => setMostrarPassword(!mostrarPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name={mostrarPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* CONFIRMAR CONTRASEÑA */}
            <Text style={styles.inputLabel}>Confirmar Nueva Contraseña</Text>
            <View style={styles.inputBox}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Repite tu nueva contraseña"
                placeholderTextColor="#94A3B8"
                value={confirmarContrasena}
                onChangeText={(val) => {
                  setConfirmarContrasena(val);
                  if (errorMsg) setErrorMsg('');
                }}
                secureTextEntry={!mostrarConfirm}
              />
              <TouchableOpacity onPress={() => setMostrarConfirm(!mostrarConfirm)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name={mostrarConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* MENSAJE DE ERROR */}
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color="#DC2626" style={{ marginRight: 8 }} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* BOTÓN ACTUALIZAR */}
            <TouchableOpacity
              style={[styles.primaryButton, guardandoPassword && styles.buttonDisabled]}
              onPress={handleCambiarContrasena}
              disabled={guardandoPassword}
              activeOpacity={0.85}
            >
              {guardandoPassword ? (
                <View style={styles.btnLoadingRow}>
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryButtonText}>Guardando contraseña...</Text>
                </View>
              ) : (
                <View style={styles.btnLoadingRow}>
                  <Ionicons name="save-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryButtonText}>Actualizar Contraseña</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* BOTÓN REGRESAR AL PASO 1 */}
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => {
                setPaso(1);
                setErrorMsg('');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.btnSecondaryText}>Cambiar CURP o Correo</Text>
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
    backgroundColor: '#F4F7FB',
  },
  topHeader: {
    backgroundColor: '#000684',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  topHeaderSub: {
    fontSize: 12,
    color: '#93C5FD',
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  stepsIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: '#000684',
  },
  stepDotText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748B',
  },
  stepDotTextActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    width: 60,
    height: 3,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#000684',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 12,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: '#0F172A',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    padding: 10,
    marginTop: 14,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#DC2626',
    lineHeight: 16,
  },
  primaryButton: {
    backgroundColor: '#000684',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  btnLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  btnSecondary: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  btnSecondaryText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  userFoundBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  userFoundTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#15803D',
  },
  userFoundName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 1,
  },
  userFoundDetails: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 6, 132, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 26,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  modalSuccessIcon: {
    marginBottom: 12,
  },
  modalSuccessTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSuccessText: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  modalPrimaryBtn: {
    backgroundColor: '#000684',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default RestablecerContra;