import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { initializeApp } from "firebase/app";
import { ApolloProvider } from "@apollo/client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import client from "./config/apollo";

import HomeScreen from "./screens/HomeScreen";
import HistorialStudio from "./screens/HistorialStudio";
import AnalisisClinicos from "./screens/Products/AnalisisClinicos";
import Cardiologia from "./screens/Products/Cardiologia";
import Colonscopia from "./screens/Products/Colposcopia";
import Densitometria from "./screens/Products/Densitometria";
import GastroEnter from "./screens/Products/GastroEnter";
import Mastogra from "./screens/Products/Mastogra";
import Neurofisiologia from "./screens/Products/Neurofisiologia";
import RayosX from "./screens/Products/RayosX";
import RayosxContrastados from "./screens/Products/RayosxContrastados";
import ResonanciaMagnetica from "./screens/Products/ResonanciaMagnetica";
import TomogrMultic from "./screens/Products/TomogrMultic";
import ProfileScreen from "./screens/ProfileScreen";
import Settings from "./screens/Settings";
import CrearCuenta from "./screens/CrearCuenta";
import DatosPer from "./screens/DatosPer";
import TiendaScreen from "./screens/TiendaScreen";
import UltrasonConDop from "./screens/Products/UltrasonConDop";
import { Ionicons } from "@expo/vector-icons";
import AllProducts from "./screens/Products/AllProducts";
import PromoDesc from "./screens/PromoDesc";
import RestablecerContra from "./screens/RestablecerContra";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const firebaseConfig = {
  apiKey: "AIzaSyAiWGXT0nzkQepeXYBnAcBf7fJdaq99Neo",
  projectId: "mrimagen-medica",
  storageBucket: "imagenmedicamri.appspot.com",
  messagingSenderId: "16572583283",
  appId: "1:486875083714:android:607f5bd592524b2c905c5b",
};

const app = initializeApp(firebaseConfig);

const HomeStackNavigator = createStackNavigator();

function MyStack() {
  return (
    <ApolloProvider client={client}>
      <HomeStackNavigator.Navigator screenOptions={{ headerShown: false }}>
        <HomeStackNavigator.Screen
          name="InicioScreen"
          component={HomeScreen}
          options={{
            headerShown: false,
            headerBackTitleVisible: false,
            headerTitle: null,
          }}
        />

        <HomeStackNavigator.Screen
          name="HistorialStudio"
          component={HistorialStudio}
          options={{
            headerShown: false,
          }}
        />

        <HomeStackNavigator.Screen
          name="AnalisisClinicos"
          component={AnalisisClinicos}
          options={{
            headerShown: false,
          }}
        />

        <HomeStackNavigator.Screen
          name="Cardiologia"
          component={Cardiologia}
          options={{
            headerShown: false,
          }}
        />

        <HomeStackNavigator.Screen
          name="Colposcopia"
          component={Colonscopia}
          options={{
            headerShown: false,
          }}
        />

        <HomeStackNavigator.Screen
          name="Densitometria"
          component={Densitometria}
          options={{
            headerShown: false,
          }}
        />

        <HomeStackNavigator.Screen
          name="GastroEnter"
          component={GastroEnter}
          options={{
            headerShown: false,
          }}
        />

        <HomeStackNavigator.Screen
          name="Mastogra"
          component={Mastogra}
          options={{
            headerShown: false,
          }}
        />

        <HomeStackNavigator.Screen
          name="Neurofisiologia"
          component={Neurofisiologia}
          options={{
            headerShown: false,
          }}
        />

        <HomeStackNavigator.Screen
          name="RayosX"
          component={RayosX}
          options={{
            headerShown: false,
          }}
        />

        <HomeStackNavigator.Screen
          name="RayosxContrastados"
          component={RayosxContrastados}
          options={{
            headerShown: false,
          }}
        />

        <HomeStackNavigator.Screen
          name="RestablecerContra"
          component={RestablecerContra}
          options={{
            headerShown: false,
          }}
        />

        <HomeStackNavigator.Screen
          name="ResonanciaMagnetica"
          component={ResonanciaMagnetica}
          options={{
            headerShown: false,
          }}
        />

        <HomeStackNavigator.Screen
          name="TomogrMultic"
          component={TomogrMultic}
          options={{
            headerShown: false,
          }}
        />

        <HomeStackNavigator.Screen
          name="UltrasonConDop"
          component={UltrasonConDop}
          options={{
            headerShown: false,
          }}
        />

        <HomeStackNavigator.Screen
          name="PromoDesc"
          component={PromoDesc}
          options={{
            headerShown: false,
          }}
        />

        <HomeStackNavigator.Screen
          name="AllProducts"
          component={AllProducts}
          options={{
            headerShown: false,
          }}
        />

        <HomeStackNavigator.Screen
          name="CrearCuenta"
          component={CrearCuenta}
          options={{
            headerShown: false,
          }}
        />

        <HomeStackNavigator.Screen
          name="Datos Personales"
          component={DatosPer}
          options={{
            headerShown: false,
          }}
        />
      </HomeStackNavigator.Navigator>
    </ApolloProvider>
  );
}

const Tab = createBottomTabNavigator();

function App() {
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        setUserToken(storedToken);
      } catch (err) {
        console.log("Error al consultar token de sesion:", err);
      }
    };
    checkToken();
    const interval = setInterval(checkToken, 2000);
    return () => clearInterval(interval);
  }, []);

  const registerForPushNotificationsAsync = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        return;
      }
      const tokenData = await Notifications.getExpoPushTokenAsync();
      console.log("Expo Push Token:", tokenData.data);
    } catch (err) {
      console.log("Notificaciones no configuradas en entorno local:", err.message);
    }
  };

  return (
    <ApolloProvider client={client}>
      <NavigationContainer>
        <Tab.Navigator
          initialRouteName="Inicio"
          screenOptions={({ route }) => ({
            tabBarIcon: ({ color, size }) => {
              let iconName;
              if (route.name === "Inicio") {
                iconName = "home";
              } else if (route.name === "Tienda") {
                iconName = "cart-sharp";
              } else if (route.name === "Perfil") {
                iconName = "person-sharp";
              } else if (route.name === "Configuracion") {
                iconName = userToken ? "settings" : "log-in";
              }
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            headerShown: false,
            tabBarActiveTintColor: "#000066",
            tabBarInactiveTintColor: "#ffffff",
            tabBarActiveBackgroundColor: "#E7E7E7",
            tabBarInactiveBackgroundColor: "#000066",
          })}
        >
          <Tab.Screen
            name="Inicio"
            component={MyStack}
            listeners={({ navigation }) => ({
              tabPress: (e) => {
                e.preventDefault();
                navigation.navigate("InicioScreen", { screen: "HomeScreen" });
              },
            })}
          />
          
          <Tab.Screen name="Perfil" component={ProfileScreen} />
          <Tab.Screen
            name="Configuracion"
            component={Settings}
            options={{
              tabBarLabel: userToken ? "Configuración" : "Iniciar Sesión",
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </ApolloProvider>
  );
}

export default App;
