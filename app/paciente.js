import axios from "axios";
import { Video } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import {
    Box,
    Button,
    FormControl,
    Heading,
    HStack,
    Image,
    Input,
    Modal,
    Spinner,
    Text,
    VStack,
} from "native-base";
import { useEffect, useState } from "react";
import { Alert, ScrollView } from "react-native";

const API_URL = "http://192.168.18.49:4000/api/pacientes";

export default function PacienteScreen() {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dniBuscar, setDniBuscar] = useState("");
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);

  // Modal estados
  const [modalAgregarPaciente, setModalAgregarPaciente] = useState(false);
  const [modalHistoriaClinica, setModalHistoriaClinica] = useState(false);
  const [modalAgregarDiagnostico, setModalAgregarDiagnostico] = useState(false);

  // Nuevo paciente
  const [nuevoPaciente, setNuevoPaciente] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    telefono: "",
    direccion: "",
    edad: "",
  });

  // Nuevo diagnóstico
  const [nuevoDiagnostico, setNuevoDiagnostico] = useState({
    diagnostico: "",
    observaciones: "",
    odontologo: "",
    file: null,
  });

  useEffect(() => {
    listarPacientes();
  }, []);

  const listarPacientes = async () => {
    try {
      const res = await axios.get(API_URL);
      setPacientes(res.data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudieron cargar los pacientes");
    } finally {
      setLoading(false);
    }
  };

  const crearPaciente = async () => {
    const { nombre, apellido, dni } = nuevoPaciente;
    if (!nombre || !apellido || !dni) {
      Alert.alert("Error", "Nombre, apellido y DNI son obligatorios");
      return;
    }

    try {
      const res = await axios.post(API_URL, nuevoPaciente);
      setPacientes([...pacientes, res.data]);
      setNuevoPaciente({ nombre: "", apellido: "", dni: "", telefono: "", direccion: "", edad: "" });
      setModalAgregarPaciente(false);
      Alert.alert("Éxito", "Paciente agregado correctamente");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", error.response?.data?.message || "No se pudo crear el paciente");
    }
  };

  const eliminarPaciente = async (dni) => {
    try {
      await axios.delete(`${API_URL}/${dni}`);
      setPacientes(pacientes.filter((p) => p.dni !== dni));
      Alert.alert("Éxito", "Paciente eliminado");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo eliminar el paciente");
    }
  };

  const abrirHistoriaClinica = (paciente) => {
    setPacienteSeleccionado(paciente);
    setModalHistoriaClinica(true);
  };

  const abrirAgregarDiagnostico = () => {
    setModalAgregarDiagnostico(true);
  };

  const agregarDiagnostico = async () => {
    if (!nuevoDiagnostico.diagnostico || !nuevoDiagnostico.odontologo) {
      Alert.alert("Error", "Diagnóstico y odontólogo son obligatorios");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("diagnostico", nuevoDiagnostico.diagnostico);
      formData.append("observaciones", nuevoDiagnostico.observaciones);
      formData.append("odontologo", nuevoDiagnostico.odontologo);
      if (nuevoDiagnostico.file) {
        formData.append("files", {
          uri: nuevoDiagnostico.file.uri,
          name: nuevoDiagnostico.file.name,
          type: nuevoDiagnostico.file.mimeType || "application/octet-stream",
        });
      }

      const res = await axios.post(`${API_URL}/${pacienteSeleccionado.dni}/historia`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setPacienteSeleccionado(res.data); // actualiza la historia clínica
      setNuevoDiagnostico({ diagnostico: "", observaciones: "", odontologo: "", file: null });
      setModalAgregarDiagnostico(false);
      Alert.alert("Éxito", "Diagnóstico agregado");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo agregar el diagnóstico");
    }
  };

  // Filtrado en tiempo real por DNI
  const pacientesFiltrados = pacientes.filter((p) =>
    p.dni.includes(dniBuscar.trim())
  );

  if (loading) return <Spinner size="lg" flex={1} />;

  return (
    <ScrollView style={{ padding: 10 }} keyboardShouldPersistTaps="handled">
      <Heading mb={4}>Pacientes</Heading>

      {/* Input para buscar paciente */}
      <HStack space={2} mb={4}>
        <Input
          flex={1}
          placeholder="Buscar por DNI"
          value={dniBuscar}
          onChangeText={setDniBuscar} // búsqueda en tiempo real
        />
        <Button colorScheme="green" onPress={() => setModalAgregarPaciente(true)}>
          Agregar Paciente
        </Button>
      </HStack>

      {/* Lista de pacientes filtrados */}
      <VStack space={3} mb={5}>
        {pacientesFiltrados.map((p) => (
          <Box
            key={p.dni}
            p={3}
            bg={dniBuscar && p.dni.includes(dniBuscar.trim()) ? "yellow.100" : "gray.50"}
            rounded="md"
          >
            <Text bold>{p.nombre} {p.apellido}</Text>
            <Text>DNI: {p.dni}</Text>
            <Text>Edad: {p.edad || "N/A"}</Text>
            <HStack space={2} mt={2}>
              <Button size="sm" onPress={() => abrirHistoriaClinica(p)}>Historia Clínica</Button>
              <Button size="sm" colorScheme="red" onPress={() => eliminarPaciente(p.dni)}>Eliminar</Button>
            </HStack>
          </Box>
        ))}
      </VStack>

      {/* Modal Agregar Paciente */}
      <Modal isOpen={modalAgregarPaciente} onClose={() => setModalAgregarPaciente(false)}>
        <Modal.Content maxWidth="400px">
          <Modal.CloseButton />
          <Modal.Header>Agregar Paciente</Modal.Header>
          <Modal.Body>
            <VStack space={2}>
              {["nombre","apellido","dni","telefono","direccion","edad"].map((field, index) => (
                <FormControl key={field}>
                  <Input
                    placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                    value={nuevoPaciente[field]}
                    onChangeText={(val) => setNuevoPaciente({ ...nuevoPaciente, [field]: val })}
                    bg="white"
                    keyboardType={field === "edad" ? "numeric" : "default"}
                    autoFocus={index === 0}
                  />
                </FormControl>
              ))}
            </VStack>
          </Modal.Body>
          <Modal.Footer>
            <Button flex={1} onPress={crearPaciente}>Guardar</Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* Modal Historia Clínica */}
      <Modal isOpen={modalHistoriaClinica} onClose={() => setModalHistoriaClinica(false)}>
        <Modal.Content maxWidth="400px">
          <Modal.CloseButton />
          <Modal.Header>Historia Clínica</Modal.Header>
          <Modal.Body>
            <VStack space={2}>
              {pacienteSeleccionado?.historiaClinica?.length === 0 && <Text>No hay historias.</Text>}
              {pacienteSeleccionado?.historiaClinica?.map((h, idx) => (
                <Box key={idx} p={2} bg="gray.50" rounded="md">
                  <Text>Fecha: {new Date(h.fecha).toLocaleDateString()}</Text>
                  <Text>Diagnóstico: {h.diagnostico}</Text>
                  <Text>Observaciones: {h.observaciones || "N/A"}</Text>
                  <Text>Odontólogo: {h.odontologo}</Text>
                  {h.media && h.media.endsWith(".mp4") ? (
                    <Video
                      source={{ uri: h.media }}
                      useNativeControls
                      resizeMode="contain"
                      style={{ width: "100%", height: 200 }}
                    />
                  ) : h.media ? (
                    <Image source={{ uri: h.media }} alt="media" size="xl" />
                  ) : null}
                </Box>
              ))}
            </VStack>
          </Modal.Body>
          <Modal.Footer>
            <Button flex={1} colorScheme="green" onPress={abrirAgregarDiagnostico}>
              Añadir Registro
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* Modal Agregar Diagnóstico */}
      <Modal isOpen={modalAgregarDiagnostico} onClose={() => setModalAgregarDiagnostico(false)}>
        <Modal.Content maxWidth="400px">
          <Modal.CloseButton />
          <Modal.Header>Agregar Diagnóstico</Modal.Header>
          <Modal.Body>
            <VStack space={2}>
              <FormControl>
                <Input
                  placeholder="Diagnóstico"
                  value={nuevoDiagnostico.diagnostico}
                  onChangeText={(val) => setNuevoDiagnostico({ ...nuevoDiagnostico, diagnostico: val })}
                  bg="white"
                />
              </FormControl>
              <FormControl>
                <Input
                  placeholder="Observaciones"
                  value={nuevoDiagnostico.observaciones}
                  onChangeText={(val) => setNuevoDiagnostico({ ...nuevoDiagnostico, observaciones: val })}
                  bg="white"
                />
              </FormControl>
              <FormControl>
                <Input
                  placeholder="Odontólogo"
                  value={nuevoDiagnostico.odontologo}
                  onChangeText={(val) => setNuevoDiagnostico({ ...nuevoDiagnostico, odontologo: val })}
                  bg="white"
                />
              </FormControl>
              <FormControl>
                <Button
                  onPress={async () => {
                    try {
                      const result = await DocumentPicker.getDocumentAsync({ type: "*" });
                      if (result.type === "success") {
                        setNuevoDiagnostico({ ...nuevoDiagnostico, file: result });
                      }
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                >
                  {nuevoDiagnostico.file ? nuevoDiagnostico.file.name : "Seleccionar archivo"}
                </Button>
              </FormControl>
            </VStack>
          </Modal.Body>
          <Modal.Footer>
            <Button flex={1} onPress={agregarDiagnostico}>
              Guardar
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </ScrollView>
  );
}
