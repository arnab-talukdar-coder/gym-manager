import GradientButton from "@/components/ui/GradientButton";
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import { Picker } from "@react-native-picker/picker";
import { addDoc, collection } from "firebase/firestore";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { db } from "../firebaseConfig";

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

      // Registration Payment
      await addDoc(collection(db, "payments"), {
        memberId: memberRef.id,
        amount: Number(registrationFee),
        paidOn: today,
        method: regPaymentMethod,
        type: "registration",
      });

      // Membership Payment
      await addDoc(collection(db, "payments"), {
        memberId: memberRef.id,
        amount: Number(membershipFee),
        paidOn: today,
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
      setError("");
    } catch (err) {
      console.log(err);
      setError("Error adding member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Add New Member</Text>

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

        <Text style={styles.label}>Select ID Proof</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={idType}
            onValueChange={(itemValue) => setIdType(itemValue)}
            dropdownIconColor="#fff"
          >
            <Picker.Item label="Select ID Type" value="" />
            <Picker.Item label="Aadhar Card" value="Aadhar Card" />
            <Picker.Item label="Voter ID" value="Voter ID" />
            <Picker.Item label="Driving License" value="Driving License" />
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

        <Text style={styles.label}>Registration Payment Method</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={regPaymentMethod}
            onValueChange={(itemValue) => setRegPaymentMethod(itemValue)}
          >
            <Picker.Item label="Select Payment Method" value="" />
            <Picker.Item label="Cash" value="cash" />
            <Picker.Item label="UPI" value="upi" />
            <Picker.Item label="Online" value="online" />
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

        <Text style={styles.label}>Membership Payment Method</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={memPaymentMethod}
            onValueChange={(itemValue) => setMemPaymentMethod(itemValue)}
          >
            <Picker.Item label="Select Payment Method" value="" />
            <Picker.Item label="Cash" value="cash" />
            <Picker.Item label="UPI" value="upi" />
            <Picker.Item label="Online" value="online" />
          </Picker>
        </View>

        {error !== "" && <Text style={styles.error}>{error}</Text>}

        <GradientButton title="ADD MEMBER" onPress={addMember} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#1c1c1c",
    color: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  label: {
    color: "#fff",
    marginBottom: 5,
  },
  pickerContainer: {
    backgroundColor: "#1c1c1c",
    borderRadius: 8,
    marginBottom: 15,
    color: "#fff",
  },
  button: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  error: {
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
});
