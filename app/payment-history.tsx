import { useLocalSearchParams } from "expo-router";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { db } from "../firebaseConfig";

export default function PaymentHistory() {
  const { memberId } = useLocalSearchParams();

  const [payments, setPayments] = useState<any[]>([]);
  const [membershipTotal, setMembershipTotal] = useState(0);
  const [registrationTotal, setRegistrationTotal] = useState(0);
  const [cashTotal, setCashTotal] = useState(0);
  const [upiTotal, setUpiTotal] = useState(0);
  const [onlineTotal, setOnlineTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!memberId) return;

    const q = query(
      collection(db, "payments"),
      where("memberId", "==", memberId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];

      let membership = 0;
      let registration = 0;
      let cash = 0;
      let upi = 0;
      let online = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const amount = Number(data.amount || 0);

        list.push({ id: doc.id, ...data });

        if (data.type === "membership") membership += amount;
        if (data.type === "registration") registration += amount;
        if (data.method === "cash") cash += amount;
        if (data.method === "upi") upi += amount;
        if (data.method === "online") online += amount;
      });

      list.sort((a, b) => (b.paidOn?.seconds || 0) - (a.paidOn?.seconds || 0));

      setPayments(list);
      setMembershipTotal(membership);
      setRegistrationTotal(registration);
      setCashTotal(cash);
      setUpiTotal(upi);
      setOnlineTotal(online);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [memberId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  const totalPaid = membershipTotal + registrationTotal;

  return (
    <SafeAreaView style={styles.container}>
      {payments.length === 0 ? (
        <Text style={styles.empty}>No Payments Found</Text>
      ) : (
        <>
          {/* SUMMARY */}
          <Text style={styles.title}>Payment History</Text>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>
              Membership Paid: ₹{membershipTotal}
            </Text>
            <Text style={styles.summaryText}>
              Registration Paid: ₹{registrationTotal}
            </Text>
            <Text style={styles.totalText}>Total Paid: ₹{totalPaid}</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>Cash: ₹{cashTotal}</Text>
            <Text style={styles.summaryText}>UPI: ₹{upiTotal}</Text>
            <Text style={styles.summaryText}>Online: ₹{onlineTotal}</Text>
          </View>

          {/* PAYMENT LIST */}
          <FlatList
            data={payments}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.amount}>₹{item.amount}</Text>

                <Text style={styles.text}>
                  Type: {item.type?.toUpperCase()}
                </Text>

                <Text style={styles.text}>
                  Method: {item.method?.toUpperCase()}
                </Text>

                <Text style={styles.text}>
                  Date:{" "}
                  {item.paidOn?.seconds
                    ? new Date(
                        item.paidOn.seconds * 1000
                      ).toLocaleDateString()
                    : "N/A"}
                </Text>
              </View>
            )}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6", // ✅ light background
    padding: 18,
    paddingTop: 54
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
  },

  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#6b7280",
    fontSize: 15,
  },

  summaryCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  summaryText: {
    color: "#374151",
    fontSize: 14,
    marginBottom: 4,
  },

  totalText: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: "700",
    color: "#2563eb", // blue highlight
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  amount: {
    color: "#16a34a", // green amount
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },

  text: {
    color: "#4b5563",
    fontSize: 13,
    marginBottom: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 16,
  },
});

