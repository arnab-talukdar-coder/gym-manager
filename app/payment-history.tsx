import { useLocalSearchParams } from "expo-router";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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
      where("memberId", "==", memberId),
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

        list.push({ id: doc.id, ...data });

        const amount = Number(data.amount || 0);

        if (data.type === "membership") {
          membership += amount;
        }

        if (data.type === "registration") {
          registration += amount;
        }

        if (data.method === "cash") cash += amount;
        if (data.method === "upi") upi += amount;
        if (data.method === "online") online += amount;
      });

      // Sort newest first
      list.sort((a, b) => {
        const aDate = a.paidOn?.seconds || 0;
        const bDate = b.paidOn?.seconds || 0;
        return bDate - aDate;
      });

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
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  const totalPaid = membershipTotal + registrationTotal;

  return (
    <View style={styles.container}>
      {payments.length === 0 ? (
        <Text style={{ color: "#fff" }}>No Payments Found</Text>
      ) : (
        <>
          {/* Summary Section */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>
              Membership Paid: ₹{membershipTotal}
            </Text>
            <Text style={styles.summaryText}>
              Registration Paid: ₹{registrationTotal}
            </Text>
            <Text style={styles.summaryText}>Total Paid: ₹{totalPaid}</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>Cash: ₹{cashTotal}</Text>
            <Text style={styles.summaryText}>UPI: ₹{upiTotal}</Text>
            <Text style={styles.summaryText}>Online: ₹{onlineTotal}</Text>
          </View>

          {/* Payment List */}
          <FlatList
            data={payments}
            keyExtractor={(item) => item.id}
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
                    ? new Date(item.paidOn.seconds * 1000).toLocaleDateString()
                    : "N/A"}
                </Text>
              </View>
            )}
          />
        </>
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
    backgroundColor: "#000",
  },
  summaryCard: {
    backgroundColor: "#1c1c1c",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  summaryText: {
    color: "#fff",
    marginBottom: 5,
    fontSize: 14,
  },
  card: {
    backgroundColor: "#1c1c1c",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  amount: {
    color: "#4CAF50",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  text: {
    color: "#ccc",
    marginBottom: 3,
  },
});
