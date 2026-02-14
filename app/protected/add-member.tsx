import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { db } from "../../firebaseConfig";

export default function AddMember() {
  const insets = useSafeAreaInsets();

  const [memberType, setMemberType] = useState<"new" | "existing">("new");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");

  const [registrationFee, setRegistrationFee] = useState("");
  const [membershipFee, setMembershipFee] = useState("");
  const [regPaymentMethod, setRegPaymentMethod] = useState("");
  const [memPaymentMethod, setMemPaymentMethod] = useState("");

  const [error, setError] = useState("");

  const [dob, setDob] = useState<Date | null>(null);

  // 🔥 Default today but selectable
  const [registrationDate, setRegistrationDate] = useState<Date>(new Date());

  const [nextDueDate, setNextDueDate] = useState<Date | null>(null);

  const [showDobPicker, setShowDobPicker] = useState(false);
  const [showRegPicker, setShowRegPicker] = useState(false);
  const [showNextDuePicker, setShowNextDuePicker] = useState(false);

  const calculateAge = (birthDate: Date | null) => {
    if (!birthDate) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const formatDate = (date: Date) => {
    const d = date.getDate().toString().padStart(2, "0");
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  // Reset logic when switching type
  useEffect(() => {
    if (memberType === "new") {
      setRegistrationDate(new Date());
      setNextDueDate(null);
    }
  }, [memberType]);

  const validateFields = () => {
    const missing: string[] = [];

    if (memberType === "new") {
      if (!name) missing.push("Name");
      if (!phone) missing.push("Phone");

      if (Number(registrationFee) > 0 && !regPaymentMethod)
        missing.push("Registration Payment Method");

      if (Number(membershipFee) > 0 && !memPaymentMethod)
        missing.push("Membership Payment Method");
    }

    if (memberType === "existing") {
      if (!name) missing.push("Name");
    }

    if (missing.length > 0) {
      setError(
        `${missing.join(", ")} ${missing.length > 1 ? "are" : "is"} mandatory`,
      );
      return false;
    }

    return true;
  };

  const addMember = async () => {
    setError("");
    if (!validateFields()) return;

    try {
      if (memberType === "new") {
        const phoneQuery = query(
          collection(db, "members"),
          where("phone", "==", phone),
        );
        const phoneSnapshot = await getDocs(phoneQuery);
        if (!phoneSnapshot.empty) {
          setError("Member with this phone number already exists");
          return;
        }
      }

      let calculatedNextDue: Date | null = null;

      if (memberType === "new") {
        calculatedNextDue = new Date(registrationDate);
        calculatedNextDue.setMonth(calculatedNextDue.getMonth() + 1);
      } else {
        calculatedNextDue = nextDueDate ?? null;
      }

      const memberRef = await addDoc(collection(db, "members"), {
        name,
        phone: phone || null,
        dob: dob ?? null,
        age: calculateAge(dob),
        idType,
        idNumber,
        registrationDate: memberType === "new" ? registrationDate : null,
        lastPaidDate: memberType === "new" ? registrationDate : null,
        nextDueDate: calculatedNextDue,
        registrationFee:
          memberType === "new" ? Number(registrationFee) || 0 : 0,
        membershipFee: memberType === "new" ? Number(membershipFee) || 0 : 0,
        memberType,
        status: "active",
      });

      if (memberType === "new") {
        if (Number(registrationFee) > 0) {
          await addDoc(collection(db, "payments"), {
            memberId: memberRef.id,
            memberName: name,
            amount: Number(registrationFee),
            paidOn: registrationDate,
            method: regPaymentMethod,
            type: "registration",
          });
        }

        if (Number(membershipFee) > 0) {
          await addDoc(collection(db, "payments"), {
            memberId: memberRef.id,
            memberName: name,
            amount: Number(membershipFee),
            paidOn: registrationDate,
            method: memPaymentMethod,
            type: "membership",
          });
        }
      }

      Alert.alert("Success", "Member added successfully");
      router.back();
    } catch (err) {
      console.log(err);
      setError("Error adding member");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: insets.bottom + 20,
          }}
        >
          <Text style={styles.title}>Add Member</Text>

          {/* MEMBER TYPE */}
          <Text style={styles.label}>Member Type</Text>
          <View style={styles.toggleRow}>
            {["new", "existing"].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.toggleBtn,
                  memberType === type && styles.toggleActive,
                ]}
                onPress={() => setMemberType(type as any)}
              >
                <Text
                  style={[
                    styles.toggleText,
                    memberType === type && styles.toggleTextActive,
                  ]}
                >
                  {type === "new" ? "New" : "Existing"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input label="Full Name *" value={name} setValue={setName} />
          <Input
            label="Phone Number"
            value={phone}
            setValue={setPhone}
            keyboard="numeric"
          />

          {/* DOB */}
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

          {/* 🔥 Auto Age Display */}
          {dob && (
            <View style={styles.ageBox}>
              <Text style={styles.ageText}>Age: {calculateAge(dob)} years</Text>
            </View>
          )}

          {/* 🔥 ID TYPE */}
          <Text style={styles.label}>ID Type</Text>
          <View style={styles.input}>
            <Picker
              mode="dropdown"
              style={{ height: 50 }}
              selectedValue={idType}
              onValueChange={(value) => {
                setIdType(value);
                if (!value) setIdNumber("");
              }}
            >
              <Picker.Item label="Select ID Type" value="" />
              <Picker.Item label="Aadhar Card" value="aadhar" />
              <Picker.Item label="PAN Card" value="pan" />
              <Picker.Item label="Driving License" value="dl" />
              <Picker.Item label="Passport" value="passport" />
            </Picker>
          </View>

          {idType !== "" && (
            <Input label="ID Number" value={idNumber} setValue={setIdNumber} />
          )}

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

          {/* NEW MEMBER SECTION */}
          {memberType === "new" && (
            <>
              <Text style={styles.label}>Registration Date</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowRegPicker(true)}
              >
                <Text style={{ padding: 12 }}>
                  {formatDate(registrationDate)}
                </Text>
              </TouchableOpacity>

              {showRegPicker && (
                <DateTimePicker
                  value={registrationDate}
                  mode="date"
                  maximumDate={new Date()}
                  onChange={(e, d) => {
                    setShowRegPicker(false);
                    if (d) setRegistrationDate(d);
                  }}
                />
              )}

              <Input
                label="Registration Fee"
                value={registrationFee}
                setValue={setRegistrationFee}
                keyboard="numeric"
              />

              {Number(registrationFee) > 0 && (
                <PickerField
                  label="Registration Payment"
                  value={regPaymentMethod}
                  setValue={setRegPaymentMethod}
                />
              )}

              <Input
                label="Membership Fee"
                value={membershipFee}
                setValue={setMembershipFee}
                keyboard="numeric"
              />

              {Number(membershipFee) > 0 && (
                <PickerField
                  label="Membership Payment"
                  value={memPaymentMethod}
                  setValue={setMemPaymentMethod}
                />
              )}
            </>
          )}

          {/* EXISTING MEMBER */}
          {memberType === "existing" && (
            <>
              <Text style={styles.label}>Next Due Date</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowNextDuePicker(true)}
              >
                <Text style={{ padding: 12 }}>
                  {nextDueDate
                    ? formatDate(nextDueDate)
                    : "Select Next Due Date"}
                </Text>
              </TouchableOpacity>

              {showNextDuePicker && (
                <DateTimePicker
                  value={nextDueDate || new Date()}
                  mode="date"
                  onChange={(e, d) => {
                    setShowNextDuePicker(false);
                    if (d) setNextDueDate(d);
                  }}
                />
              )}
            </>
          )}

          {error !== "" && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity style={styles.button} onPress={addMember}>
            <Text style={styles.buttonText}>Add Member</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------- Components ---------- */

const Input = ({ label, value, setValue, keyboard }: any) => (
  <>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={setValue}
      keyboardType={keyboard}
      style={[styles.input, { padding: 12 }]}
    />
  </>
);

const PickerField = ({ label, value, setValue }: any) => (
  <>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.input}>
      <Picker
        mode="dropdown"
        style={{ height: 50 }}
        selectedValue={value}
        onValueChange={(itemValue) => setValue(itemValue)}
      >
        <Picker.Item label="Select Payment Method" value="" />
        <Picker.Item label="Cash" value="cash" />
        <Picker.Item label="UPI" value="upi" />
        <Picker.Item label="Online" value="online" />
      </Picker>
    </View>
  </>
);

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },
  label: { fontWeight: "600", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    marginBottom: 14,
    height: 50, // 👈 ADD THIS
    justifyContent: "center",
  },

  button: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  error: {
    color: "#dc2626",
    textAlign: "center",
    marginVertical: 10,
    fontWeight: "600",
  },
  toggleRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    alignItems: "center",
    marginRight: 8,
  },
  toggleActive: {
    backgroundColor: "#2563eb",
  },
  toggleText: {
    fontWeight: "600",
  },
  toggleTextActive: {
    color: "#fff",
  },
  ageBox: {
    backgroundColor: "#eff6ff",
    padding: 10,
    borderRadius: 12,
    marginBottom: 14,
  },

  ageText: {
    color: "#2563eb",
    fontWeight: "600",
  },
});
