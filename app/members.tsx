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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../firebaseConfig";

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
      list.forEach((member) => {
        checkAndSendReminder(member);
      });

      setFilteredMembers(list);
      setLoading(false);

      // 🔥 Auto archive check
      checkAndArchiveMembers(list);
    });

    return () => unsubscribe();
  }, []);

  const handleSearch = (text: string) => {
    setSearch(text);

    const filtered = members.filter(
      (member) =>
        member.name.toLowerCase().includes(text.toLowerCase()) ||
        member.phone.includes(text),
    );

    setFilteredMembers(filtered);
  };

  const markAsPaid = async (member: any) => {
    const selectedMethod = selectedMethods[member.id];

    if (!selectedMethod) {
      alert("Please select payment method first");
      return;
    }

    try {
      const today = new Date();

      const baseDate = member.nextDueDate?.seconds
        ? new Date(member.nextDueDate.seconds * 1000)
        : new Date();

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
    } catch (error) {
      console.log(error);
    }
  };

  const calculateUnpaid = (member: any) => {
    if (!member.nextDueDate || !member.nextDueDate.seconds) {
      return 0;
    }

    const today = new Date();
    const dueDate = new Date(member.nextDueDate.seconds * 1000);

    if (today <= dueDate) return 0;

    const diffMonths =
      (today.getFullYear() - dueDate.getFullYear()) * 12 +
      (today.getMonth() - dueDate.getMonth());

    return diffMonths + 1;
  };

  const getDueStatus = (member: any) => {
    if (!member.nextDueDate?.seconds) return "no-date";

    const today = new Date();
    const dueDate = new Date(member.nextDueDate.seconds * 1000);

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "overdue";
    if (diffDays === 0) return "due-today";
    if (diffDays <= 3) return "due-soon";

    return "ok";
  };
  const checkAndSendReminder = async (member: any) => {
    if (!member.nextDueDate?.seconds) return;

    const today = new Date();
    const dueDate = new Date(member.nextDueDate.seconds * 1000);

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Send reminder 3 days before due
    if (diffDays === 3) {
      // prevent duplicate reminder same day
      if (!member.lastReminderSent) {
        console.log(`Reminder sent to ${member.name}`);

        await updateDoc(doc(db, "members", member.id), {
          lastReminderSent: today,
        });
      }
    }
  };

  const checkAndArchiveMembers = async (memberList: any[]) => {
    for (const member of memberList) {
      const unpaid = calculateUnpaid(member);

      if (unpaid >= 3 && member.status !== "archived") {
        await updateDoc(doc(db, "members", member.id), {
          status: "archived",
        });
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <TextInput
        placeholder="Search by name or phone"
        placeholderTextColor="#999"
        value={search}
        onChangeText={handleSearch}
        style={styles.searchInput}
      />

      {filteredMembers.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ color: "#fff" }}>No Members Found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMembers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.text}>Phone: {item.phone}</Text>
              <Text style={styles.text}>
                Membership Fee: ₹{item.membershipFee}
              </Text>
              <Text
                style={{
                  color: calculateUnpaid(item) > 0 ? "#ff4d4d" : "#4CAF50",
                }}
              >
                Unpaid Months: {calculateUnpaid(item)}
              </Text>

              <Text style={{ color: "#ccc" }}>
                Next Due:{" "}
                {item.nextDueDate?.seconds
                  ? new Date(item.nextDueDate.seconds * 1000).toDateString()
                  : "Not Set"}
              </Text>

              <Text
                style={{ color: item.status === "archived" ? "red" : "white" }}
              >
                Status: {item.status}
              </Text>

              <View style={{ flexDirection: "row", marginTop: 8 }}>
                {["cash", "upi", "online"].map((method) => (
                  <TouchableOpacity
                    key={method}
                    onPress={() =>
                      setSelectedMethods((prev) => ({
                        ...prev,
                        [item.id]: method,
                      }))
                    }
                    style={{
                      backgroundColor:
                        selectedMethods[item.id] === method
                          ? "#2196F3"
                          : "#333",
                      padding: 6,
                      marginRight: 8,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ color: "#fff" }}>
                      {method.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text
                style={{
                  color:
                    getDueStatus(item) === "overdue"
                      ? "red"
                      : getDueStatus(item) === "due-today"
                        ? "orange"
                        : getDueStatus(item) === "due-soon"
                          ? "yellow"
                          : "#4CAF50",
                }}
              >
                Billing Status: {getDueStatus(item)}
              </Text>

              <TouchableOpacity
                style={[
                  styles.payButton,
                  !selectedMethods[item.id] && { opacity: 0.5 },
                ]}
                disabled={!selectedMethods[item.id]}
                onPress={() => markAsPaid(item)}
              >
                <Text style={{ color: "#fff" }}>Mark as Paid</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: "#333",
                  padding: 8,
                  borderRadius: 6,
                  marginTop: 6,
                  alignItems: "center",
                }}
                onPress={() =>
                  router.push({
                    pathname: "/payment-history",
                    params: { memberId: item.id },
                  })
                }
              >
                <Text style={{ color: "#fff" }}>View Payment History</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 15,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  searchInput: {
    backgroundColor: "#1c1c1c",
    color: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  card: {
    backgroundColor: "#1c1c1c",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  name: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  text: {
    color: "#ccc",
    marginTop: 4,
  },
  payButton: {
    backgroundColor: "#4CAF50",
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
    alignItems: "center",
  },
});
