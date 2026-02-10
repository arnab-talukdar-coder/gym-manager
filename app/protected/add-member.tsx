import ScreenWrapper from "@/components/ui/ScreenWrapper";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../firebaseConfig";

export default function AddMember() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [age, setAge] = useState("");
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [registrationFee, setRegistrationFee] = useState("");
  const [membershipFee, setMembershipFee] = useState("");

  const [regPaymentMethod, setRegPaymentMethod] = useState("");
  const [memPaymentMethod, setMemPaymentMethod] = useState("");

  const [registrationDate, setRegistrationDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const addMember = async () => {
    setError("");

    if (
      !name ||
      !phone ||
      !dob ||
      !age ||
      !idType ||
      !idNumber ||
      !registrationFee ||
      !membershipFee ||
      !regPaymentMethod ||
      !memPaymentMethod
    ) {
      setError("All fields are mandatory");
      return;
    }

    try {
      setLoading(true);

      const nextDue = new Date(registrationDate);
      nextDue.setMonth(nextDue.getMonth() + 1);

      const memberRef = await addDoc(collection(db, "members"), {
        name,
        phone,
        dob,
        age: Number(age),
        idType,
        idNumber,
        registrationFee: Number(registrationFee),
        membershipFee: Number(membershipFee),
        registrationDate: Timestamp.fromDate(registrationDate),
        lastPaidDate: Timestamp.fromDate(registrationDate),
        nextDueDate: Timestamp.fromDate(nextDue),
        status: "active",
      });

      await addDoc(collection(db, "payments"), {
        memberId: memberRef.id,
        amount: Number(registrationFee),
        paidOn: Timestamp.fromDate(registrationDate),
        method: regPaymentMethod,
        type: "registration",
      });

      await addDoc(collection(db, "payments"), {
        memberId: memberRef.id,
        amount: Number(membershipFee),
        paidOn: Timestamp.fromDate(registrationDate),
        method: memPaymentMethod,
        type: "membership",
      });

      // Reset
      setName("");
      setPhone("");
      setDob("");
      setAge("");
      setIdType("");
      setIdNumber("");
      setRegistrationFee("");
      setMembershipFee("");
      setRegPaymentMethod("");
      setMemPaymentMethod("");
      setRegistrationDate(new Date());
    } catch (err) {
      console.log(err);
      setError("Error adding member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Add New Member</Text>

        <View style={styles.card}>
          <TextInput
            placeholder="Full Name"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          <TextInput
            placeholder="Phone Number"
            placeholderTextColor="#999"
            value={phone}
            onChangeText={setPhone}
            style={styles.input}
            keyboardType="numeric"
          />

          <TextInput
            placeholder="Date of Birth (DD/MM/YYYY)"
            placeholderTextColor="#999"
            value={dob}
            onChangeText={setDob}
            style={styles.input}
          />

          <TextInput
            placeholder="Age"
            placeholderTextColor="#999"
            value={age}
            onChangeText={setAge}
            style={styles.input}
            keyboardType="numeric"
          />

          {/* Registration Date */}
          <Text style={styles.label}>Registration Date</Text>

          {Platform.OS === "web" ? (
            <input
              type="date"
              value={registrationDate.toISOString().split("T")[0]}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => setRegistrationDate(new Date(e.target.value))}
              style={styles.webInput}
            />
          ) : (
            <>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: "#fff" }}>
                  {registrationDate.toDateString()}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={registrationDate}
                  mode="date"
                  maximumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setRegistrationDate(selectedDate);
                  }}
                />
              )}
            </>
          )}

          {/* ID Proof */}
          <Text style={styles.label}>Select ID Proof</Text>

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={idType}
              onValueChange={(itemValue) => setIdType(itemValue)}
              mode="dialog"
              style={styles.picker}
            >
              <Picker.Item label="Select ID Type" value="" color="#888" />
              <Picker.Item
                label="Aadhar Card"
                value="Aadhar Card"
                color="#000"
              />
              <Picker.Item label="Voter ID" value="Voter ID" color="#000" />
              <Picker.Item
                label="Driving License"
                value="Driving License"
                color="#000"
              />
            </Picker>
          </View>

          <TextInput
            placeholder="ID Proof Number"
            placeholderTextColor="#999"
            value={idNumber}
            onChangeText={setIdNumber}
            style={styles.input}
          />

          <TextInput
            placeholder="Registration Fee"
            placeholderTextColor="#999"
            value={registrationFee}
            onChangeText={setRegistrationFee}
            style={styles.input}
            keyboardType="numeric"
          />

          {/* Registration Payment */}
          <Text style={styles.label}>Registration Payment Method</Text>

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={regPaymentMethod}
              onValueChange={(itemValue) => setRegPaymentMethod(itemValue)}
              mode="dialog"
              style={styles.picker}
            >
              <Picker.Item label="Select Method" value="" color="#888" />
              <Picker.Item label="Cash" value="cash" color="#000" />
              <Picker.Item label="UPI" value="upi" color="#000" />
            </Picker>
          </View>

          <TextInput
            placeholder="Membership Fee"
            placeholderTextColor="#999"
            value={membershipFee}
            onChangeText={setMembershipFee}
            style={styles.input}
            keyboardType="numeric"
          />

          {/* Membership Payment */}
          <Text style={styles.label}>Membership Payment Method</Text>

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={memPaymentMethod}
              onValueChange={(itemValue) => setMemPaymentMethod(itemValue)}
              mode="dialog"
              style={styles.picker}
            >
              <Picker.Item label="Select Method" value="" color="#888" />
              <Picker.Item label="Cash" value="cash" color="#000" />
              <Picker.Item label="UPI" value="upi" color="#000" />
            </Picker>
          </View>

          {error !== "" && (
            <Text style={{ color: "red", marginBottom: 10 }}>{error}</Text>
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={addMember}
            disabled={loading}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>
              {loading ? "ADDING..." : "ADD MEMBER"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#1c1c1c",
    padding: 15,
    borderRadius: 10,
  },
  input: {
    backgroundColor: "#1c1c1c",
    color: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#333",
  },
  label: {
    color: "#ccc",
    marginBottom: 6,
  },
  pickerContainer: {
    backgroundColor: "#1c1c1c",
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#333",
    overflow: "hidden",
  },
  picker: {
    color: "#fff",
    backgroundColor: "#1c1c1c",
  },
  webInput: {
    backgroundColor: "#1c1c1c",
    color: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#333",
  },
  button: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
});
