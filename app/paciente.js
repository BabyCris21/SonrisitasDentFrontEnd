// app/paciente.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from "axios";
import { Video } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import { Linking, Platform } from "react-native";


import {
  Box,
  Button,
  Center,
  FormControl,
  HStack,
  Input,
  Spinner,
  Text,
  VStack,
} from "native-base";
import { useEffect, useState } from "react";
import { Alert, FlatList, Image, Modal, ScrollView } from "react-native";

const Paciente = () => {
  const router = useRouter();

  const [token, setToken] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [modalPacienteVisible, setModalPacienteVisible] = useState(false);
  const [modalHistoriaVisible, setModalHistoriaVisible] = useState(false);
  const [historiaSeleccionada, setHistoriaSeleccionada] = useState(null);
  const [nuevoPaciente, setNuevoPaciente] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    telefono: "",
    direccion: "",
    fechaNacimiento: "",
  });
  const [loading, setLoading] = useState(false);
  const [descargando, setDescargando] = useState(false);

  // Cargar token
  useEffect(() => {
    const cargarToken = async () => {
      const t = await AsyncStorage.getItem("token");
      setToken(t);
    };
    cargarToken();
  }, []);

  // Listar pacientes cuando haya token
  useEffect(() => {
    if (token) listarPacientes();
  }, [token]);

  const listarPacientes = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("http://192.168.18.49:4000/api/pacientes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPacientes(data.pacientes || data);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los pacientes");
    } finally {
      setLoading(false);
    }
  };

  const filtrarPacientes = () => {
    if (!filtro) return pacientes;
    return pacientes.filter((p) => p.dni.includes(filtro));
  };

  const handleCrearPaciente = async () => {
    const { nombre, apellido, dni, fechaNacimiento } = nuevoPaciente;
    if (!nombre || !apellido || !dni || !fechaNacimiento) {
      Alert.alert(
        "Error",
        "Nombre, apellido, DNI y fecha de nacimiento son obligatorios"
      );
      return;
    }

    try {
      setLoading(true);
      await axios.post("http://192.168.18.49:4000/api/pacientes", nuevoPaciente, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setModalPacienteVisible(false);
      setNuevoPaciente({
        nombre: "",
        apellido: "",
        dni: "",
        telefono: "",
        direccion: "",
        fechaNacimiento: "",
      });
      listarPacientes();
    } catch (error) {
      Alert.alert("Error", "No se pudo crear el paciente");
    } finally {
      setLoading(false);
    }
  };

  const renderPaciente = ({ item }) => (
    <Box borderBottomWidth={1} borderColor="coolGray.200" py={2}>
      <Text bold>
        {item.nombre} {item.apellido} - DNI: {item.dni}
      </Text>
      <Text>
        Tel: {item.telefono || "-"} | Dirección: {item.direccion || "-"} | Fecha
        Nac: {item.fechaNacimiento?.split("T")[0] || "-"}
      </Text>
      <HStack space={2} mt={2}>
        <Button
          size="sm"
          flex={1}
          onPress={() => {
            setHistoriaSeleccionada(item);
            setModalHistoriaVisible(true);
          }}
        >
          Ver Historia Clínica
        </Button>
        <Button size="sm" flex={1} variant="outline">
          Añadir Diagnóstico
        </Button>
      </HStack>
    </Box>
  );

  if (!token)
    return (
      <Center flex={1}>
        <Spinner size="lg" />
      </Center>
    );

  return (
    <Box flex={1} p={4} bg="white">
      <Button variant="ghost" mb={3} onPress={() => router.push("/home")}>
        ← Regresar
      </Button>

      <Text fontSize="2xl" bold mb={4}>
        Pacientes
      </Text>

      <HStack mb={4} space={2}>
        <Input
          flex={1}
          placeholder="Filtrar por DNI"
          value={filtro}
          onChangeText={setFiltro}
        />
        <Button onPress={() => setModalPacienteVisible(true)}>Añadir Paciente</Button>
      </HStack>

      {loading ? (
        <Center flex={1}>
          <Spinner size="lg" />
        </Center>
      ) : (
        <FlatList
          data={filtrarPacientes()}
          keyExtractor={(item) => item._id}
          renderItem={renderPaciente}
          ListEmptyComponent={
            <Center mt={5}>
              <Text>No hay pacientes</Text>
            </Center>
          }
        />
      )}

      {/* Modal Crear Paciente */}
      <Modal visible={modalPacienteVisible} animationType="slide" transparent>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 16 }}
        >
          <Center>
            <Box bg="white" p={5} rounded="lg" width="90%">
              <Text fontSize="lg" bold mb={3}>
                Crear Paciente
              </Text>
              <VStack space={3}>
                {/* Campos normales */}
                {["nombre", "apellido", "dni", "telefono", "direccion"].map(
                  (field) => (
                    <FormControl key={field}>
                      <FormControl.Label>
                        {field.charAt(0).toUpperCase() + field.slice(1)}
                      </FormControl.Label>
                      <Input
                        placeholder={field}
                        value={nuevoPaciente[field]}
                        onChangeText={(text) =>
                          setNuevoPaciente({ ...nuevoPaciente, [field]: text })
                        }
                      />
                    </FormControl>
                  )
                )}

                {/* Campo de fecha de nacimiento con DatePicker */}
                <FormControl>
                  <FormControl.Label>Fecha de Nacimiento</FormControl.Label>
                  <Button onPress={() => setShowDatePicker(true)}>
                    {nuevoPaciente.fechaNacimiento
                      ? nuevoPaciente.fechaNacimiento
                      : "Seleccionar Fecha"}
                  </Button>
                </FormControl>

                {showDatePicker && (
                  <DateTimePicker
                    value={
                      nuevoPaciente.fechaNacimiento
                        ? new Date(nuevoPaciente.fechaNacimiento)
                        : new Date()
                    }
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setNuevoPaciente({
                          ...nuevoPaciente,
                          fechaNacimiento: selectedDate.toISOString().split("T")[0],
                        });
                      }
                    }}
                    maximumDate={new Date()}
                  />
                )}

                {/* Botones Guardar / Cancelar */}
                <HStack mt={3} space={2}>
                  <Button flex={1} onPress={handleCrearPaciente}>
                    Guardar
                  </Button>
                  <Button
                    flex={1}
                    variant="ghost"
                    onPress={() => setModalPacienteVisible(false)}
                  >
                    Cancelar
                  </Button>
                </HStack>
              </VStack>
            </Box>
          </Center>
        </ScrollView>
      </Modal>


      {/* Modal Historia Clínica */}
      <Modal visible={modalHistoriaVisible} animationType="slide" transparent>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 16 }}
        >
          <Center>
            <Box bg="white" p={5} rounded="lg" width="90%">
              <Text fontSize="lg" bold mb={3}>
                Historia Clínica
              </Text>
              {historiaSeleccionada ? (
                <>
                  <Text bold>
                    Paciente: {historiaSeleccionada.nombre} {historiaSeleccionada.apellido}
                  </Text>
                  <Text>DNI: {historiaSeleccionada.dni}</Text>

                  <VStack space={3} mt={4}>
                    {historiaSeleccionada.historiaClinica.length ? (
                      historiaSeleccionada.historiaClinica.map((h, index) => (
                        <Box
                          key={h._id || index}
                          p={3}
                          borderWidth={1}
                          borderColor="coolGray.200"
                          rounded="md"
                        >
                          <Text bold>Diagnóstico:</Text>
                          <Text>{h.diagnostico || "-"}</Text>

                          {h.tratamiento && (
                            <>
                              <Text bold mt={1}>
                                Tratamiento:
                              </Text>
                              <Text>{h.tratamiento}</Text>
                            </>
                          )}

                          {h.observaciones && (
                            <>
                              <Text bold mt={1}>
                                Observaciones:
                              </Text>
                              <Text>{h.observaciones}</Text>
                            </>
                          )}

                          <Text bold mt={1}>
                            Fecha:
                          </Text>
                          <Text>{new Date(h.fecha).toLocaleString()}</Text>

                          {h.media ? (
                            h.media.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                              <>
                                <Image
                                  source={{ uri: h.media }}
                                  style={{ width: "100%", height: 200, borderRadius: 8 }}
                                  resizeMode="contain"
                                />
                                <Button
                                  mt={2}
                                  onPress={async () => {
                                    try {
                                      setDescargando(true);

                                      const { status } = await MediaLibrary.requestPermissionsAsync();
                                      if (status !== "granted") {
                                        Alert.alert(
                                          "Permiso denegado",
                                          "Necesitamos acceso a la galería para guardar la imagen"
                                        );
                                        setDescargando(false);
                                        return;
                                      }

                                      const fileUri = FileSystem.cacheDirectory + h.media.split("/").pop();
                                      const downloaded = await FileSystem.downloadAsync(h.media, fileUri);

                                      const asset = await MediaLibrary.createAssetAsync(downloaded.uri);
                                      await MediaLibrary.createAlbumAsync("Sonrisitas", asset, false);

                                      setDescargando(false);

                                      // Abrir la imagen automáticamente
                                      if (Platform.OS === "ios") {
                                        await Linking.openURL(downloaded.uri);
                                      } else {
                                        Alert.alert("Éxito", "Imagen descargada en la galería");
                                      }
                                    } catch (error) {
                                      console.log(error);
                                      setDescargando(false);
                                      Alert.alert("Error", "No se pudo descargar la imagen");
                                    }
                                  }}
                                >
                                  {descargando ? <Spinner color="white" /> : "Descargar Imagen"}
                                </Button>
                              </>
                            ) : h.media.match(/\.(mp4|mov|avi)$/i) ? (
                              <Video
                                source={{ uri: h.media }}
                                style={{ width: "100%", height: 200, borderRadius: 8 }}
                                useNativeControls
                                resizeMode="contain"
                                isLooping
                              />
                            ) : (
                              <Text>Media no compatible</Text>
                            )
                          ) : (
                            <Text>No hay media</Text>
                          )}
                        </Box>
                      ))
                    ) : (
                      <Text>No hay historial clínico registrado</Text>
                    )}
                  </VStack>
                </>
              ) : (
                <Text>Cargando...</Text>
              )}
              <Button mt={4} onPress={() => setModalHistoriaVisible(false)}>
                Cerrar
              </Button>
            </Box>
          </Center>
        </ScrollView>
      </Modal>
    </Box>
  );
};

export default Paciente;



