import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  TextInput,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  Linking,
  View,
  TouchableOpacity,
  Alert,
  StatusBar,
  Modal,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { gql, useMutation } from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import base64 from 'base-64';
import { useForceUpdate } from '../Components/useForceUpdate';

const AUTENTICAR_USER = gql`
  mutation autenticarUsuario($input: AutenticarInput) {
    autenticarUsuario(input: $input) {
      token
    }
  }
`;

const parseJwt = (tokenStr) => {
  try {
    const base64Url = tokenStr.split('.')[1];
    const base64String = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      base64
        .decode(base64String)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    try {
      return JSON.parse(base64.decode(tokenStr.split('.')[1]));
    } catch (err) {
      return null;
    }
  }
};

const Settings = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState(null);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [token, setToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalLogout, setModalLogout] = useState(false);

  const forceUpdate = useForceUpdate();
  const navigation = useNavigation();
  const [autenticarUsuario] = useMutation(AUTENTICAR_USER);

  const getToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      setToken(storedToken);
      if (storedToken) {
        const decoded = parseJwt(storedToken);
        setUserData(decoded);
      } else {
        setUserData(null);
      }
    } catch (error) {
      console.log('Error al obtener el token:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getToken();
    }, [])
  );

  const handleSubmit = async () => {
    if (email.trim() === '' || password === '') {
      setMensaje('Por favor, completa todos los campos.');
      return;
    }

    if (password.length < 6) {
      setMensaje('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setMensaje(null);

    try {
      const { data } = await autenticarUsuario({
        variables: {
          input: {
            email: email.trim(),
            password,
          },
        },
      });

      const tokenRecibido = data.autenticarUsuario.token;
      await AsyncStorage.setItem('token', tokenRecibido);
      setToken(tokenRecibido);
      setMensaje(null);
      setLoading(false);

      if (tokenRecibido) {
        navigation.navigate('Perfil');
      }
    } catch (error) {
      console.log('Error de login:', error);
      setLoading(false);
      forceUpdate();
      setMensaje('Credenciales incorrectas. Verifica tu correo y contraseña.');
    }
  };

  const confirmarCerrarSesion = async () => {
    try {
      await AsyncStorage.removeItem('token');
      setToken(null);
      setUserData(null);
      setModalLogout(false);
      setEmail('');
      setPassword('');
      navigation.navigate('InicioScreen');
    } catch (error) {
      console.log('Error al cerrar sesión:', error);
    }
  };

  const handleOpenDoc = (url) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'No se pudo abrir el documento.');
    });
  };

  const SolicitudDer = () => {
    handleOpenDoc('https://www.mrimagenmedica.com.mx/wp-content/uploads/2024/08/Solicitud-derechos-arco.pdf');
  };

  const ordenMedica = () => {
    handleOpenDoc('https://www.mrimagenmedica.com.mx/wp-content/uploads/2024/08/Orden-Medica-2024.pdf');
  };

  const avisoPriv = () => {
    handleOpenDoc('https://www.mrimagenmedica.com.mx/wp-content/uploads/2024/08/Aviso-privacidad.pdf');
  };

  const AyudaEmail = () => {
    const emailTo = 'callcentercva@mrimagenmedica.com.mx';
    const subject = 'Ayuda APP Imagen Médica MRI';
    const body = 'Hola, estoy utilizando la aplicación móvil y necesito asistencia.';
    const url = `mailto:${emailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Soporte', 'Puedes escribirnos a callcentercva@mrimagenmedica.com.mx');
    });
  };

  const AyudaWhatsApp = () => {
    const phoneNumber = '+52 1 777 362 0260';
    const message = '¡Hola! Necesito asistencia con mi cuenta en la aplicación móvil de Imagen Médica MRI.';
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://wa.me/5217773620260?text=${encodeURIComponent(message)}`);
    });
  };

  const LlamarCallCenter = () => {
    Linking.openURL('tel:7773620260');
  };

  // VISTA 1: USUARIO AUTENTICADO -> PANEL DE CONFIGURACIÓN
  if (token !== null) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#000684" />
        
        {/* HEADER SUPERIOR */}
        <View style={styles.loggedHeader}>
          <Text style={styles.loggedHeaderTitle}>Configuración</Text>
          <Text style={styles.loggedHeaderSub}>Ajustes, formatos oficiales y asistencia</Text>
        </View>

        <ScrollView contentContainerStyle={styles.loggedScroll} showsVerticalScrollIndicator={false}>
          {/* TARJETA DE PACIENTE ACTIVO */}
          <View style={styles.patientCard}>
            <View style={styles.patientAvatar}>
              <Ionicons name="person" size={26} color="#000684" />
            </View>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>
                {userData?.nombre || userData?.username || 'Paciente Registrado'}
              </Text>
              <Text style={styles.patientCurp}>
                {userData?.curp ? `CURP: ${userData.curp}` : 'Cuenta activa'}
              </Text>
              <View style={styles.activeBadge}>
                <Ionicons name="checkmark-circle" size={12} color="#137333" style={{ marginRight: 4 }} />
                <Text style={styles.activeBadgeText}>Sesión Activa</Text>
              </View>
            </View>
          </View>

          {/* SECCIÓN 1: FORMATOS Y DOCUMENTOS */}
          <Text style={styles.sectionHeading}>DOCUMENTOS Y FORMATOS OFICIALES</Text>
          <View style={styles.cardGroup}>
            <TouchableOpacity style={styles.optionRow} onPress={SolicitudDer} activeOpacity={0.7}>
              <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="document-text-outline" size={22} color="#4338CA" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Solicitud de Derechos ARCO</Text>
                <Text style={styles.optionSubtitle}>Acceso, rectificación y cancelación de datos</Text>
              </View>
              <View style={styles.badgePdf}>
                <Text style={styles.badgePdfText}>PDF</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity style={styles.optionRow} onPress={ordenMedica} activeOpacity={0.7}>
              <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="clipboard-outline" size={22} color="#15803D" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Orden Médica 2024</Text>
                <Text style={styles.optionSubtitle}>Formato oficial para estudios clínicos</Text>
              </View>
              <View style={styles.badgePdf}>
                <Text style={styles.badgePdfText}>PDF</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity style={styles.optionRow} onPress={avisoPriv} activeOpacity={0.7}>
              <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="shield-checkmark-outline" size={22} color="#1D4ED8" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Aviso de Privacidad</Text>
                <Text style={styles.optionSubtitle}>Protección y resguardo de tus datos</Text>
              </View>
              <View style={styles.badgePdf}>
                <Text style={styles.badgePdfText}>PDF</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* SECCIÓN 2: ATENCIÓN Y CONTACTO */}
          <Text style={styles.sectionHeading}>SOPORTE Y ATENCIÓN</Text>
          <View style={styles.cardGroup}>
            <TouchableOpacity style={styles.optionRow} onPress={AyudaWhatsApp} activeOpacity={0.7}>
              <View style={[styles.iconBox, { backgroundColor: '#E8F8EE' }]}>
                <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Atención por WhatsApp</Text>
                <Text style={styles.optionSubtitle}>Cotizaciones, dudas y horarios de sucursales</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity style={styles.optionRow} onPress={LlamarCallCenter} activeOpacity={0.7}>
              <View style={[styles.iconBox, { backgroundColor: '#F0F9FF' }]}>
                <Ionicons name="call-outline" size={22} color="#0284C7" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Llamar a Call Center</Text>
                <Text style={styles.optionSubtitle}>777 362 0260 (Atención directa)</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity style={styles.optionRow} onPress={AyudaEmail} activeOpacity={0.7}>
              <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="mail-outline" size={22} color="#D97706" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Reportar un Problema</Text>
                <Text style={styles.optionSubtitle}>Enviar mensaje de soporte técnico</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* SECCIÓN 3: SESIÓN */}
          <Text style={styles.sectionHeading}>CUENTA</Text>
          <View style={styles.cardGroup}>
            <TouchableOpacity style={styles.optionRow} onPress={() => setModalLogout(true)} activeOpacity={0.7}>
              <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="log-out-outline" size={22} color="#DC2626" />
              </View>
              <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, { color: '#DC2626' }]}>Cerrar Sesión</Text>
                <Text style={styles.optionSubtitle}>Salir de la cuenta en este dispositivo</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#F87171" />
            </TouchableOpacity>
          </View>

          {/* FOOTER VERSIÓN */}
          <View style={styles.footerContainer}>
            <Image
              source={require('../assets/logos/logoph.png')}
              style={styles.footerLogo}
              resizeMode="contain"
            />
            <Text style={styles.footerVersion}>Imagen Médica MRI • Versión 1.0.0</Text>
            <Text style={styles.footerCopyright}>Calidad y calidez para tu salud</Text>
          </View>
        </ScrollView>

        {/* MODAL DE CONFIRMACIÓN DE CERRAR SESIÓN */}
        <Modal visible={modalLogout} transparent animationType="fade" onRequestClose={() => setModalLogout(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalIconBox}>
                <Ionicons name="log-out" size={32} color="#DC2626" />
              </View>
              <Text style={styles.modalTitle}>¿Cerrar Sesión?</Text>
              <Text style={styles.modalText}>
                Tendrás que ingresar nuevamente tus datos para acceder a tu historial y monedero electrónico.
              </Text>
              <View style={styles.modalButtonsRow}>
                <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setModalLogout(false)}>
                  <Text style={styles.modalBtnCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalBtnConfirm} onPress={confirmarCerrarSesion}>
                  <Text style={styles.modalBtnConfirmText}>Sí, Cerrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // VISTA 2: USUARIO NO AUTENTICADO -> EXPERIENCIA DE LOGIN MODERNA
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView contentContainerStyle={styles.loginScroll} showsVerticalScrollIndicator={false}>
        {/* LOGO Y ENCABEZADO */}
        <View style={styles.loginHeader}>
          <Image
            source={require('../assets/logos/logoph.png')}
            style={styles.loginLogo}
            resizeMode="contain"
          />
          <View style={styles.loginBadge}>
            <Ionicons name="lock-closed" size={12} color="#000684" style={{ marginRight: 4 }} />
            <Text style={styles.loginBadgeText}>PORTAL DE PACIENTES</Text>
          </View>
          <Text style={styles.loginTitle}>Inicia Sesión</Text>
          <Text style={styles.loginSub}>
            Accede para consultar tus resultados, monedero electrónico y estudios médicos.
          </Text>
        </View>

        {/* TARJETA DEL FORMULARIO */}
        <View style={styles.formCard}>
          {/* CAMPO CORREO */}
          <Text style={styles.inputLabel}>Correo Electrónico</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="ejemplo@correo.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(texto) => {
                setEmail(texto);
                if (mensaje) setMensaje(null);
              }}
            />
          </View>

          {/* CAMPO CONTRASEÑA */}
          <Text style={styles.inputLabel}>Contraseña</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Ingresa tu contraseña"
              placeholderTextColor="#94A3B8"
              secureTextEntry={!mostrarPassword}
              value={password}
              onChangeText={(texto) => {
                setPassword(texto);
                if (mensaje) setMensaje(null);
              }}
            />
            <TouchableOpacity
              onPress={() => setMostrarPassword(!mostrarPassword)}
              style={styles.eyeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={mostrarPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#64748B"
              />
            </TouchableOpacity>
          </View>

          {/* MENSAJE DE ERROR */}
          {mensaje && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{mensaje}</Text>
            </View>
          )}

          {/* BOTÓN SUBMIT */}
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <View style={styles.buttonLoadingRow}>
                <ActivityIndicator color="#FFFFFF" size="small" style={{ marginRight: 8 }} />
                <Text style={styles.primaryButtonText}>Iniciando sesión...</Text>
              </View>
            ) : (
              <View style={styles.buttonLoadingRow}>
                <Ionicons name="log-in-outline" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* ACCESOS ADICIONALES */}
          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => navigation.navigate('RestablecerContra')}
          >
            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => navigation.navigate('CrearCuenta')}
            activeOpacity={0.7}
          >
            <Ionicons name="person-add-outline" size={18} color="#000684" style={{ marginRight: 8 }} />
            <Text style={styles.registerButtonText}>Crear una Cuenta Nueva</Text>
          </TouchableOpacity>
        </View>

        {/* AYUDA POR WHATSAPP */}
        <TouchableOpacity style={styles.whatsappHelpCard} onPress={AyudaWhatsApp} activeOpacity={0.7}>
          <Ionicons name="logo-whatsapp" size={22} color="#25D366" style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.whatsappHelpTitle}>¿Problemas para acceder?</Text>
            <Text style={styles.whatsappHelpSub}>Contáctanos por WhatsApp para asistencia con tu cuenta</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#25D366" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },

  // ESTILOS PANEL LOGUEADO
  loggedHeader: {
    backgroundColor: '#000684',
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 22,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  loggedHeaderTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  loggedHeaderSub: {
    fontSize: 13,
    color: '#DCE4F0',
    marginTop: 4,
  },
  loggedScroll: {
    padding: 16,
    paddingBottom: 40,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  patientAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 2,
  },
  patientCurp: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E8F8EE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 11,
    color: '#137333',
    fontWeight: '600',
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  cardGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
    marginRight: 8,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  badgePdf: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  badgePdfText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
  },
  separator: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 68,
  },
  footerContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerLogo: {
    width: 100,
    height: 40,
    marginBottom: 8,
    opacity: 0.85,
  },
  footerVersion: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  footerCopyright: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },

  // MODAL LOGOUT
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  modalIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  modalBtnCancelText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 14,
  },
  modalBtnConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  modalBtnConfirmText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },

  // ESTILOS LOGIN
  loginScroll: {
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  loginHeader: {
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  loginLogo: {
    width: 140,
    height: 60,
    marginBottom: 14,
  },
  loginBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  loginBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000684',
    letterSpacing: 0.5,
  },
  loginTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 6,
  },
  loginSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  eyeBtn: {
    padding: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#000684',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000684',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  forgotBtn: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 4,
  },
  forgotText: {
    fontSize: 13,
    color: '#0056BD',
    fontWeight: '500',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: '#94A3B8',
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#000684',
    borderRadius: 12,
    height: 46,
    backgroundColor: '#FFFFFF',
  },
  registerButtonText: {
    color: '#000684',
    fontSize: 14,
    fontWeight: 'bold',
  },
  whatsappHelpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    width: '100%',
    borderWidth: 1,
    borderColor: '#CBE7D3',
  },
  whatsappHelpTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#137333',
  },
  whatsappHelpSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
});

export default Settings;

