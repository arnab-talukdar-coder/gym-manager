import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { router, useLocalSearchParams } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../firebaseConfig";

export default function EditMember() {
  const { id } = useLocalSearchParams();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");

  const [dob, setDob] = useState<Date | null>(null);
  const [registrationDate, setRegistrationDate] = useState<Date | null>(null);
  const [nextDueDate, setNextDueDate] = useState<Date | null>(null);

  const [showDobPicker, setShowDobPicker] = useState(false);
  const [showRegPicker, setShowRegPicker] = useState(false);
  const [showDuePicker, setShowDuePicker] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, "members", id as string));
      const data = snap.data();

      if (data) {
        setName(data.name || "");
        setPhone(data.phone || "");
        setIdType(data.idType || "");
        setIdNumber(data.idNumber || "");

        if (data.dob?.seconds) {
          setDob(new Date(data.dob.seconds * 1000));
        }

        if (data.registrationDate?.seconds) {
          setRegistrationDate(new Date(data.registrationDate.seconds * 1000));
        }

        if (data.nextDueDate?.seconds) {
          setNextDueDate(new Date(data.nextDueDate.seconds * 1000));
        }
      }
    };

    load();
  }, []);

  const calculateAge = (birthDate: Date | null) => {
    if (!birthDate) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  const formatDate = (date: Date) => {
    const d = date.getDate().toString().padStart(2, "0");
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const validate = () => {
    if (!name.trim()) {
      setError("Name is mandatory");
      return false;
    }
    return true;
  };

  const save = async () => {
    setError("");

    if (!validate()) return;

    try {
      await updateDoc(doc(db, "members", id as string), {
        name,
        phone: phone || null,
        idType: idType || null,
        idNumber: idNumber || null,
        dob: dob ?? null,
        age: calculateAge(dob),
        registrationDate: registrationDate ?? null,
        nextDueDate: nextDueDate ?? null,
      });

      Alert.alert("Updated Successfully");
      router.back();
    } catch (error) {
      console.log(error);
      Alert.alert("Update failed");
    }
  };

  const cancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Edit Member</Text>

        {/* NAME */}
        <Text style={styles.label}>Name *</Text>
        <TextInput value={name} onChangeText={setName} style={styles.input} />

        {/* PHONE */}
        <Text style={styles.label}>Phone</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          style={styles.input}
          keyboardType="numeric"
        />

        {/* DOB */}
        <Text style={styles.label}>Date of Birth</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowDobPicker(true)}
        >
          <Text style={{ padding: 12 }}>
            {dob ? formatDate(dob) : "Select DOB"}
          </Text>
        </TouchableOpacity>

        {showDobPicker && (
          <DateTimePicker
            value={dob || new Date()}
            mode="date"
            maximumDate={new Date()}
            onChange={(e, d) => {
              setShowDobPicker(false);
              if (d) setDob(d);
            }}
          />
        )}

        {dob && (
          <Text style={styles.ageText}>Age: {calculateAge(dob)} years</Text>
        )}

        {/* ID TYPE */}
        <Text style={styles.label}>ID Type</Text>
        <View style={styles.input}>
          <Picker selectedValue={idType} onValueChange={setIdType}>
            <Picker.Item label="Select ID Type" value="" />
            <Picker.Item label="DL" value="DL" />
            <Picker.Item label="Passport" value="Passport" />
            <Picker.Item label="Aadhar" value="Aadhar" />
            <Picker.Item label="Voter ID" value="Voter ID" />
          </Picker>
        </View>

        {/* ID NUMBER */}
        {idType !== "" && (
          <>
            <Text style={styles.label}>ID Number</Text>
            <TextInput
              value={idNumber}
              onChangeText={setIdNumber}
              style={styles.input}
            />
          </>
        )}

        {/* REGISTRATION DATE */}
        <Text style={styles.label}>Registration Date</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowRegPicker(true)}
        >
          <Text style={{ padding: 12 }}>
            {registrationDate
              ? formatDate(registrationDate)
              : "Select Registration Date"}
          </Text>
        </TouchableOpacity>

        {showRegPicker && (
          <DateTimePicker
            value={registrationDate || new Date()}
            mode="date"
            maximumDate={new Date()}
            onChange={(e, d) => {
              setShowRegPicker(false);
              if (d) setRegistrationDate(d);
            }}
          />
        )}

        {/* NEXT DUE DATE */}
        <Text style={styles.label}>Next Due Date</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowDuePicker(true)}
        >
          <Text style={{ padding: 12 }}>
            {nextDueDate ? formatDate(nextDueDate) : "Select Next Due Date"}
          </Text>
        </TouchableOpacity>

        {showDuePicker && (
          <DateTimePicker
            value={nextDueDate || new Date()}
            mode="date"
            onChange={(e, d) => {
              setShowDuePicker(false);
              if (d) setNextDueDate(d);
            }}
          />
        )}

        {error !== "" && <Text style={styles.error}>{error}</Text>}

        {/* BUTTON ROW */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={cancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveBtn} onPress={save}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f3f4f6" },
  container: { padding: 20 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  label: { marginTop: 12, fontWeight: "600" },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  ageText: {
    marginTop: 6,
    color: "#2563eb",
    fontWeight: "600",
  },
  error: {
    color: "#dc2626",
    marginTop: 10,
    textAlign: "center",
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#e5e7eb",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginRight: 10,
  },
  cancelText: {
    fontWeight: "600",
    color: "#374151",
  },
  saveBtn: {
    flex: 1,
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  saveText: {
    color: "#fff",
    fontWeight: "600",
  },
});
