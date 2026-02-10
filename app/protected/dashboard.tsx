import { router } from "expo-router";
import { collection, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import LogoutButton from "../../components/LogoutButton";
import { db } from "../../firebaseConfig";

export default function Dashboard() {
  const [membershipRevenue, setMembershipRevenue] = useState(0);
  const [registrationRevenue, setRegistrationRevenue] = useState(0);
  const [cashTotal, setCashTotal] = useState(0);
  const [upiTotal, setUpiTotal] = useState(0);
  const [onlineTotal, setOnlineTotal] = useState(0);
  const [joinedThisMonth, setJoinedThisMonth] = useState(0);
  const [dueToday, setDueToday] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [activeMembers, setActiveMembers] = useState(0);
  const [archivedMembers, setArchivedMembers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const unsubscribePayments = onSnapshot(
      collection(db, "payments"),
      (snapshot) => {
        let membership = 0;
        let registration = 0;
        let cash = 0;
        let upi = 0;
        let online = 0;

        snapshot.forEach((doc) => {
          const data = doc.data();

          if (data.paidOn?.seconds) {
            const paidDate = new Date(data.paidOn.seconds * 1000);

            if (
              paidDate.getMonth() === currentMonth &&
              paidDate.getFullYear() === currentYear
            ) {
              if (data.type === "membership") membership += Number(data.amount);

              if (data.type === "registration")
                registration += Number(data.amount);

              if (data.method === "cash") cash += Number(data.amount);
              if (data.method === "upi") upi += Number(data.amount);
              if (data.method === "online") online += Number(data.amount);
            }
          }
        });

        setMembershipRevenue(membership);
        setRegistrationRevenue(registration);
        setCashTotal(cash);
        setUpiTotal(upi);
        setOnlineTotal(online);
      },
    );

    const unsubscribeMembers = onSnapshot(
      collection(db, "members"),
      (snapshot) => {
        let active = 0;
        let archived = 0;
        let due = 0;
        let overdue = 0;
        let joined = 0;

        const today = new Date();

        snapshot.forEach((doc) => {
          const data = doc.data();

          if (data.status === "archived") archived++;
          else active++;

          if (data.registrationDate?.seconds) {
            const regDate = new Date(data.registrationDate.seconds * 1000);
            if (
              regDate.getMonth() === currentMonth &&
              regDate.getFullYear() === currentYear
            ) {
              joined++;
            }
          }

          if (data.nextDueDate?.seconds) {
            const dueDate = new Date(data.nextDueDate.seconds * 1000);
            const diff = Math.ceil(
              (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
            );

            if (diff === 0) due++;
            if (diff < 0) overdue++;
          }
        });

        setActiveMembers(active);
        setArchivedMembers(archived);
        setDueToday(due);
        setOverdueCount(overdue);
        setJoinedThisMonth(joined);
        setLoading(false);
      },
    );

    return () => {
      unsubscribePayments();
      unsubscribeMembers();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  const totalRevenue = membershipRevenue + registrationRevenue;

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Gym Dashboard</Text>

        <View style={styles.card}>
          <Text style={styles.cardText}>
            Membership Revenue: ₹{membershipRevenue}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardText}>
            Registration Revenue: ₹{registrationRevenue}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardText}>Total Revenue: ₹{totalRevenue}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardText}>Cash: ₹{cashTotal}</Text>
          <Text style={styles.cardText}>UPI: ₹{upiTotal}</Text>
          <Text style={styles.cardText}>Online: ₹{onlineTotal}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardText}>
            Joined This Month: {joinedThisMonth}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardText}>Due Today: {dueToday}</Text>
          <Text style={styles.cardText}>Overdue: {overdueCount}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardText}>Active: {activeMembers}</Text>
          <Text style={styles.cardText}>Archived: {archivedMembers}</Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/protected/members")}
        >
          <Text style={styles.buttonText}>View Members</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/protected/add-member")}
        >
          <Text style={styles.buttonText}>Add Member</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/protected/monthly-report")}
        >
          <Text style={styles.buttonText}>Monthly Report</Text>
        </TouchableOpacity>

        <LogoutButton />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#000",
  },

  container: {
    padding: 15,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#1c1c1c",
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
  },
  cardText: {
    color: "#fff",
    fontSize: 15,
    marginBottom: 4,
  },
  button: {
    backgroundColor: "#2196F3",
    padding: 14,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
});
