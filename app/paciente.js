import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from "axios";
import { Video } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Linking, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const Paciente = () => {
  const router = useRouter();

  const [token, setToken] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [fechaPicker, setFechaPicker] = useState(new Date());
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

  useEffect(() => {
    const cargarToken = async () => {
      const t = await AsyncStorage.getItem("token");
      setToken(t);
    };
    cargarToken();
  }, []);

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
      Alert.alert("Error", "Nombre, apellido, DNI y fecha de nacimiento son obligatorios");
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
    <View style={styles.card}>
      <Text style={styles.boldText}>{item.nombre} {item.apellido} - DNI: {item.dni}</Text>
      <Text>Tel: {item.telefono || "-"} | Dirección: {item.direccion || "-"} | Fecha Nac: {item.fechaNacimiento?.split("T")[0] || "-"}</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => { setHistoriaSeleccionada(item); setModalHistoriaVisible(true); }}>
          <Text style={styles.buttonText}>Ver Historia Clínica</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.outlineButton}>
          <Text style={styles.outlineButtonText}>Añadir Diagnóstico</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!token) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" />
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.push("/home")} style={styles.backButton}>
        <Text>← Regresar</Text>
      </TouchableOpacity>

      <Text style={styles.heading}>Pacientes</Text>

      <View style={styles.filterRow}>
        <TextInput
          style={styles.input}
          placeholder="Filtrar por DNI"
          value={filtro}
          onChangeText={setFiltro}
        />
        <TouchableOpacity style={styles.primaryButton} onPress={() => setModalPacienteVisible(true)}>
          <Text style={styles.buttonText}>Añadir Paciente</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" /></View>
      ) : (
        <FlatList
          data={filtrarPacientes()}
          keyExtractor={(item) => item._id}
          renderItem={renderPaciente}
          ListEmptyComponent={<View style={styles.center}><Text>No hay pacientes</Text></View>}
        />
      )}

      {/* Modal Crear Paciente */}
      <Modal visible={modalPacienteVisible} animationType="slide" transparent>
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>Crear Paciente</Text>

            {["nombre", "apellido", "dni", "telefono", "direccion"].map((field) => (
              <View key={field} style={styles.formGroup}>
                <Text style={styles.label}>{field.charAt(0).toUpperCase() + field.slice(1)}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={field}
                  value={nuevoPaciente[field]}
                  onChangeText={(text) => setNuevoPaciente({ ...nuevoPaciente, [field]: text })}
                />
              </View>
            ))}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Fecha de Nacimiento</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.buttonText}>{nuevoPaciente.fechaNacimiento || "Seleccionar Fecha"}</Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={fechaPicker}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                maximumDate={new Date()}
                onChange={(event, selectedDate) => {
                  if (Platform.OS === "android") setShowDatePicker(false);
                  if (selectedDate) {
                    setFechaPicker(selectedDate);
                    setNuevoPaciente({ ...nuevoPaciente, fechaNacimiento: selectedDate.toISOString().split("T")[0] });
                  }
                }}
              />
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleCrearPaciente}>
                <Text style={styles.buttonText}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.outlineButton} onPress={() => setModalPacienteVisible(false)}>
                <Text style={styles.outlineButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Modal>

      {/* Modal Historia Clínica */}
      <Modal visible={modalHistoriaVisible} animationType="slide" transparent>
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>Historia Clínica</Text>

            {historiaSeleccionada ? (
              <>
                <Text style={styles.boldText}>Paciente: {historiaSeleccionada.nombre} {historiaSeleccionada.apellido}</Text>
                <Text>DNI: {historiaSeleccionada.dni}</Text>

                {historiaSeleccionada.historiaClinica.length ? historiaSeleccionada.historiaClinica.map((h, index) => (
                  <View key={h._id || index} style={styles.card}>
                    <Text style={styles.boldText}>Diagnóstico:</Text>
                    <Text>{h.diagnostico || "-"}</Text>

                    {h.tratamiento && <><Text style={styles.boldText}>Tratamiento:</Text><Text>{h.tratamiento}</Text></>}
                    {h.observaciones && <><Text style={styles.boldText}>Observaciones:</Text><Text>{h.observaciones}</Text></>}

                    <Text style={styles.boldText}>Fecha:</Text>
                    <Text>{new Date(h.fecha).toLocaleString()}</Text>

                    {h.media ? (
                      h.media.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                        <>
                          <Image source={{ uri: h.media }} style={styles.media} resizeMode="contain" />
                          <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={async () => {
                              try {
                                setDescargando(true);
                                const { status } = await MediaLibrary.requestPermissionsAsync();
                                if (status !== "granted") {
                                  Alert.alert("Permiso denegado", "Necesitamos acceso a la galería para guardar la imagen");
                                  setDescargando(false);
                                  return;
                                }
                                const fileUri = FileSystem.cacheDirectory + h.media.split("/").pop();
                                const downloaded = await FileSystem.downloadAsync(h.media, fileUri);
                                const asset = await MediaLibrary.createAssetAsync(downloaded.uri);
                                await MediaLibrary.createAlbumAsync("Sonrisitas", asset, false);
                                setDescargando(false);
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
                            <Text style={styles.buttonText}>{descargando ? "Descargando..." : "Descargar Imagen"}</Text>
                          </TouchableOpacity>
                        </>
                      ) : h.media.match(/\.(mp4|mov|avi)$/i) ? (
                        <Video source={{ uri: h.media }} style={styles.media} useNativeControls resizeMode="contain" isLooping />
                      ) : <Text>Media no compatible</Text>
                    ) : <Text>No hay media</Text>}
                  </View>
                )) : <Text>No hay historial clínico registrado</Text>}
              </>
            ) : <Text>Cargando...</Text>}

            <TouchableOpacity style={styles.primaryButton} onPress={() => setModalHistoriaVisible(false)}>
              <Text style={styles.buttonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
};

export default Paciente;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "white" },
  heading: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  backButton: { marginBottom: 12 },
  input: { backgroundColor: "#f5f5f5", padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 16, borderWidth: 1, borderColor: "#ccc" },
  card: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 12 },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  primaryButton: { backgroundColor: "black", padding: 12, borderRadius: 8, alignItems: "center", flex: 1, marginRight: 5 },
  buttonText: { color: "white", fontWeight: "bold" },
  outlineButton: { borderWidth: 1, borderColor: "black", padding: 12, borderRadius: 8, alignItems: "center", flex: 1, marginLeft: 5 },
  outlineButtonText: { color: "black", fontWeight: "bold" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalContainer: { flexGrow: 1, justifyContent: "center", padding: 16 },
  modalContent: { backgroundColor: "white", padding: 20, borderRadius: 12 },
  modalHeading: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  formGroup: { marginBottom: 12 },
  label: { marginBottom: 4, fontWeight: "bold" },
  media: { width: "100%", height: 200, borderRadius: 8, marginTop: 8, marginBottom: 8 },
});
