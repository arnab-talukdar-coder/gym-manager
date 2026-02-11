import { Picker } from "@react-native-picker/picker";
import { addDoc, collection } from "firebase/firestore";
import React, { useState } from "react";
import {
  SafeAreaView,
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
  const [error, setError] = useState("");

  const addMember = async () => {
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
      const today = new Date();
      const nextDue = new Date();
      nextDue.setMonth(today.getMonth() + 1);

      const memberRef = await addDoc(collection(db, "members"), {
        name,
        phone,
        dob,
        age: Number(age),
        idType,
        idNumber,
        registrationFee: Number(registrationFee),
        membershipFee: Number(membershipFee),
        registrationDate: today,
        lastPaidDate: today,
        nextDueDate: nextDue,
        status: "active",
      });

      await addDoc(collection(db, "payments"), {
        memberId: memberRef.id,
        amount: Number(registrationFee),
        paidOn: today,
        method: regPaymentMethod,
        type: "registration",
      });

      await addDoc(collection(db, "payments"), {
        memberId: memberRef.id,
        amount: Number(membershipFee),
        paidOn: today,
        method: memPaymentMethod,
        type: "membership",
      });

      setError("");
    } catch (err) {
      setError("Error adding member");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.page}
      >
        <View style={styles.form}>
          <Text style={styles.title}>Add New Member</Text>

          <TextInput
            placeholder="Full Name"
            placeholderTextColor="#9ca3af"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          <TextInput
            placeholder="Phone Number"
            placeholderTextColor="#9ca3af"
            value={phone}
            onChangeText={setPhone}
            style={styles.input}
            keyboardType="numeric"
          />

          <TextInput
            placeholder="Date of Birth (DD/MM/YYYY)"
            placeholderTextColor="#9ca3af"
            value={dob}
            onChangeText={setDob}
            style={styles.input}
          />

          <TextInput
            placeholder="Age"
            placeholderTextColor="#9ca3af"
            value={age}
            onChangeText={setAge}
            style={styles.input}
            keyboardType="numeric"
          />

          <Text style={styles.label}>ID Proof</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={idType} onValueChange={setIdType}>
              <Picker.Item label="Select ID Type" value="" />
              <Picker.Item label="Aadhar Card" value="Aadhar Card" />
              <Picker.Item label="Voter ID" value="Voter ID" />
              <Picker.Item label="Driving License" value="Driving License" />
            </Picker>
          </View>

          <TextInput
            placeholder="ID Proof Number"
            placeholderTextColor="#9ca3af"
            value={idNumber}
            onChangeText={setIdNumber}
            style={styles.input}
          />

          <TextInput
            placeholder="Registration Fee"
            placeholderTextColor="#9ca3af"
            value={registrationFee}
            onChangeText={setRegistrationFee}
            style={styles.input}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Registration Payment</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={regPaymentMethod}
              onValueChange={setRegPaymentMethod}
            >
              <Picker.Item label="Select Payment Method" value="" />
              <Picker.Item label="Cash" value="cash" />
              <Picker.Item label="UPI" value="upi" />
              <Picker.Item label="Online" value="online" />
            </Picker>
          </View>

          <TextInput
            placeholder="Membership Fee"
            placeholderTextColor="#9ca3af"
            value={membershipFee}
            onChangeText={setMembershipFee}
            style={styles.input}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Membership Payment</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={memPaymentMethod}
              onValueChange={setMemPaymentMethod}
            >
              <Picker.Item label="Select Payment Method" value="" />
              <Picker.Item label="Cash" value="cash" />
              <Picker.Item label="UPI" value="upi" />
              <Picker.Item label="Online" value="online" />
            </Picker>
          </View>

          {error !== "" && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity style={styles.lightButton} onPress={addMember}>
            <Text>Add Member</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingTop: 45, // no gap background
  },

  page: {
    flexGrow: 1,
  },

  form: {
    backgroundColor: "#ffffff",
    padding: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 20,
  },

  lightButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 12,
  },

  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 14,
    color: "#111827",
    fontSize: 15,
  },

  label: {
    color: "#374151",
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 4,
    fontSize: 14,
  },

  pickerContainer: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    marginBottom: 14,
    overflow: "hidden",
  },

  error: {
    color: "#dc2626",
    textAlign: "center",
    marginVertical: 10,
    fontWeight: "600",
  },
});
