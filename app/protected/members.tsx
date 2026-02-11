import { router } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../firebaseConfig";

export default function Members() {
  const [members, setMembers] = useState<any[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMethods, setSelectedMethods] = useState<{
    [key: string]: string;
  }>({});

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "members"), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });

      setMembers(list);
      setFilteredMembers(list);
      setLoading(false);

      list.forEach((member) => checkAndSendReminder(member));
      checkAndArchiveMembers(list);
    });

    return () => unsubscribe();
  }, []);

  const handleSearch = (text: string) => {
    setSearch(text);
    const filtered = members.filter(
      (m) =>
        m.name.toLowerCase().includes(text.toLowerCase()) ||
        m.phone.includes(text),
    );
    setFilteredMembers(filtered);
  };

  const markAsPaid = async (member: any) => {
    const selectedMethod = selectedMethods[member.id];
    if (!selectedMethod) {
      alert("Please select payment method");
      return;
    }

    try {
      const today = new Date();
      const baseDate = member.nextDueDate?.seconds
        ? new Date(member.nextDueDate.seconds * 1000)
        : today;

      const nextDue = new Date(baseDate);
      nextDue.setMonth(nextDue.getMonth() + 1);

      await addDoc(collection(db, "payments"), {
        memberId: member.id,
        amount: member.membershipFee,
        paidOn: today,
        method: selectedMethod,
        type: "membership",
      });

      await updateDoc(doc(db, "members", member.id), {
        lastPaidDate: today,
        nextDueDate: nextDue,
        status: "active",
      });

      alert("Payment recorded");
    } catch (e) {
      console.log(e);
    }
  };

  const calculateUnpaid = (member: any) => {
    if (!member.nextDueDate?.seconds) return 0;
    const today = new Date();
    const dueDate = new Date(member.nextDueDate.seconds * 1000);
    if (today <= dueDate) return 0;

    const diffMonths =
      (today.getFullYear() - dueDate.getFullYear()) * 12 +
      (today.getMonth() - dueDate.getMonth());

    return diffMonths + 1;
  };

  const getDueStatus = (member: any) => {
    if (!member.nextDueDate?.seconds) return "OK";
    const today = new Date();
    const dueDate = new Date(member.nextDueDate.seconds * 1000);
    const diffDays = Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays < 0) return "OVERDUE";
    if (diffDays === 0) return "DUE TODAY";
    if (diffDays <= 3) return "DUE SOON";
    return "OK";
  };

  const checkAndSendReminder = async (member: any) => {
    if (!member.nextDueDate?.seconds) return;
    const today = new Date();
    const dueDate = new Date(member.nextDueDate.seconds * 1000);
    const diffDays = Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 3 && !member.lastReminderSent) {
      await updateDoc(doc(db, "members", member.id), {
        lastReminderSent: today,
      });
    }
  };

  const checkAndArchiveMembers = async (list: any[]) => {
    for (const m of list) {
      if (calculateUnpaid(m) >= 3 && m.status !== "archived") {
        await updateDoc(doc(db, "members", m.id), { status: "archived" });
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TextInput
        placeholder="Search by name or phone"
        placeholderTextColor="#9ca3af"
        value={search}
        onChangeText={handleSearch}
        style={styles.searchInput}
      />

      <FlatList
        data={filteredMembers}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.text}>📞 {item.phone}</Text>
            <Text style={styles.text}>💰 Fee: ₹{item.membershipFee}</Text>

            <Text
              style={[
                styles.status,
                calculateUnpaid(item) > 0 && styles.overdue,
              ]}
            >
              Unpaid Months: {calculateUnpaid(item)}
            </Text>

            <Text style={styles.text}>
              Next Due:{" "}
              {item.nextDueDate?.seconds
                ? new Date(item.nextDueDate.seconds * 1000).toDateString()
                : "Not set"}
            </Text>

            <Text
              style={[
                styles.status,
                item.status === "archived" && styles.archived,
              ]}
            >
              Status: {item.status}
            </Text>

            {/* PAYMENT METHODS */}
            <View style={styles.methodRow}>
              {["cash", "upi", "online"].map((method) => (
                <TouchableOpacity
                  key={method}
                  onPress={() =>
                    setSelectedMethods((p) => ({
                      ...p,
                      [item.id]: method,
                    }))
                  }
                  style={[
                    styles.methodBtn,
                    selectedMethods[item.id] === method &&
                      styles.methodSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.methodText,
                      selectedMethods[item.id] === method &&
                        styles.methodTextSelected,
                    ]}
                  >
                    {method.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text
              style={[
                styles.billing,
                getDueStatus(item) === "OVERDUE"
                  ? styles.overdue
                  : getDueStatus(item) !== "OK" && styles.warning,
              ]}
            >
              Billing: {getDueStatus(item)}
            </Text>

            <TouchableOpacity
              style={[
                styles.payButton,
                !selectedMethods[item.id] && { opacity: 0.5 },
              ]}
              disabled={!selectedMethods[item.id]}
              onPress={() => markAsPaid(item)}
            >
              <Text style={styles.payText}>Mark as Paid</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.historyBtn}
              onPress={() =>
                router.push({
                  pathname: "/protected/payment-history",
                  params: { memberId: item.id },
                })
              }
            >
              <Text style={styles.historyText}>View Payment History</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 16,
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight ?? 664) + 12 : 24,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    paddingTop: 24,
  },
  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 16,
    color: "#111827",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  text: {
    color: "#4b5563",
    marginTop: 4,
  },
  status: {
    marginTop: 6,
    fontWeight: "600",
    color: "#2563eb",
  },
  overdue: {
    color: "#dc2626",
  },
  warning: {
    color: "#f59e0b",
  },
  archived: {
    color: "#6b7280",
  },
  methodRow: {
    flexDirection: "row",
    marginTop: 10,
  },
  methodBtn: {
    borderWidth: 1,
    borderColor: "#c7d2fe",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  methodSelected: {
    backgroundColor: "#2563eb",
  },
  methodText: {
    color: "#2563eb",
    fontWeight: "600",
  },
  methodTextSelected: {
    color: "#fff",
  },
  billing: {
    marginTop: 6,
    fontWeight: "600",
    color: "#16a34a",
  },
  payButton: {
    backgroundColor: "#16a34a",
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
  },
  payText: {
    color: "#fff",
    fontWeight: "600",
  },
  historyBtn: {
    marginTop: 8,
    backgroundColor: "#dbeafe",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  historyText: {
    color: "#1e3a8a",
    fontWeight: "600",
  },
});
