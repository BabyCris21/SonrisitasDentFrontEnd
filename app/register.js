// app/register.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { Button, Center, Heading, Input, VStack } from "native-base";
import { useState } from "react";
import { Alert } from "react-native";

const BASE_URL = "http://192.168.18.49:4000";

export default function RegisterScreen() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const rol = "admin"; // Rol fijo

  const handleRegister = async () => {
    if (!nombre || !email || !password) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/api/user/register`, { nombre, email, password, rol });
      const loginRes = await axios.post(`${BASE_URL}/api/user/login`, { email, password });
      await AsyncStorage.setItem("token", loginRes.data.token);
      await AsyncStorage.setItem("user", JSON.stringify(loginRes.data));
      router.replace("/home");
    } catch (error) {
      Alert.alert("Error", error.response?.data?.msg || "No se pudo registrar el usuario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center flex={1} px={5} bg="gray.100">
      <VStack space={4} w="100%">
        <Heading textAlign="center" mb={5}>Registrar Usuario</Heading>
        <Input
          placeholder="Ingrese su nombre"
          value={nombre}
          onChangeText={setNombre}
          bg="white"
        />
        <Input
          placeholder="Ingrese su email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          bg="white"
        />
        <Input
          placeholder="Ingrese su contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          bg="white"
        />
        <Input
          value="Administrador"
          isDisabled
          bg="gray.200"
        />
        <Button isLoading={loading} onPress={handleRegister} colorScheme="green">
          Registrar
        </Button>
        <Button variant="outline" onPress={() => router.replace("/")}>
          Volver al Login
        </Button>
      </VStack>
    </Center>
  );
}
