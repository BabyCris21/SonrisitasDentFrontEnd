import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { Button, Center, Heading, Input, VStack } from "native-base";
import { useState } from "react";
import { Alert } from "react-native";

const BASE_URL = "http://192.168.18.49:4000";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Ingresa email y contraseña");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/user/login`, { email, password });
      await AsyncStorage.setItem("token", res.data.token);
      await AsyncStorage.setItem("user", JSON.stringify(res.data));

      Alert.alert("Éxito", "Se inició sesión correctamente");

      router.replace("/home");
    } catch (error) {
      Alert.alert("Error", "Email o contraseña incorrecta. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center flex={1} px={5} bg="gray.100">
      <VStack space={4} w="100%">
        <Heading textAlign="center" mb={5}>Login</Heading>
        <Input
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          bg="white"
        />
        <Input
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          bg="white"
        />
        <Button isLoading={loading} onPress={handleLogin}>
          Iniciar sesión
        </Button>
        <Button variant="outline" onPress={() => router.push("/register")}>
          Registrar nuevo usuario
        </Button>
      </VStack>
    </Center>
  );
}
