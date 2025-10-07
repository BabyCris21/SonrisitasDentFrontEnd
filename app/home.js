import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Button, Center, Heading, Spinner, VStack } from "native-base";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (!storedUser) {
          router.replace("/");
          return;
        }
        setUser(JSON.parse(storedUser));
      } catch (error) {
        Alert.alert("Error", "No se pudo cargar el usuario");
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Deseas cerrar sesión?",
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Sí",
          onPress: async () => {
            await AsyncStorage.removeItem("token");
            await AsyncStorage.removeItem("user");
            Alert.alert("Éxito", "Sesión cerrada correctamente");
            router.replace("/");
          },
        },
      ]
    );
  };

  if (loading) return <Center flex={1}><Spinner size="lg" /></Center>;

  return (
    <Center flex={1} px={5} bg="gray.100">
      <VStack space={4} w="100%" alignItems="center">
        <Heading>Hola {user?.nombre}</Heading>
        <Button w="100%" onPress={() => router.push("/pacientes")}>Ver Pacientes</Button>
        <Button w="100%" colorScheme="red" onPress={handleLogout}>Cerrar Sesión</Button>
      </VStack>
    </Center>
  );
}
