import { router } from "expo-router";
import { collection, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
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
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  const totalRevenue = membershipRevenue + registrationRevenue;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.page}
      >
        {/* HEADER */}
        <Text style={styles.title}>Gym Dashboard</Text>
        <Text style={styles.subtitle}>Monthly Overview</Text>

        {/* REVENUE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue</Text>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Membership</Text>
            <Text style={styles.cardValue}>₹{membershipRevenue}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Registration</Text>
            <Text style={styles.cardValue}>₹{registrationRevenue}</Text>
          </View>

          <View style={[styles.card, styles.primaryCard]}>
            <Text style={styles.primaryLabel}>Total Revenue</Text>
            <Text style={styles.primaryValue}>₹{totalRevenue}</Text>
          </View>
        </View>

        {/* PAYMENTS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Methods</Text>
          <View style={styles.row}>
            <View style={styles.smallCard}>
              <Text style={styles.cardLabel}>Cash</Text>
              <Text style={styles.cardValue}>₹{cashTotal}</Text>
            </View>
            <View style={styles.smallCard}>
              <Text style={styles.cardLabel}>UPI</Text>
              <Text style={styles.cardValue}>₹{upiTotal}</Text>
            </View>
            <View style={styles.smallCard}>
              <Text style={styles.cardLabel}>Online</Text>
              <Text style={styles.cardValue}>₹{onlineTotal}</Text>
            </View>
          </View>
        </View>

        {/* MEMBERS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Members</Text>

          <View style={styles.row}>
            <View style={styles.smallCard}>
              <Text style={styles.cardLabel}>Active</Text>
              <Text style={styles.cardValue}>{activeMembers}</Text>
            </View>
            <View style={styles.smallCard}>
              <Text style={styles.cardLabel}>Archived</Text>
              <Text style={styles.cardValue}>{archivedMembers}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.smallCard}>
              <Text style={styles.cardLabel}>Joined This Month</Text>
              <Text style={styles.cardValue}>{joinedThisMonth}</Text>
            </View>
            <View style={styles.smallCard}>
              <Text style={styles.cardLabel}>Due Today</Text>
              <Text style={styles.cardValue}>{dueToday}</Text>
            </View>
            <View style={styles.smallCard}>
              <Text style={styles.cardLabel}>Overdue</Text>
              <Text style={styles.cardValue}>{overdueCount}</Text>
            </View>
          </View>
        </View>

        {/* BUTTONS */}
        <TouchableOpacity
          style={styles.lightButton}
          onPress={() => router.push("/protected/members")}
        >
          <Text style={styles.lightButtonText}>View Members</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/protected/add-member")}
        >
          <Text style={styles.primaryButtonText}>Add Member</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.lightButton}
          onPress={() => router.push("/protected/monthly-report")}
        >
          <Text style={styles.lightButtonText}>Monthly Report</Text>
        </TouchableOpacity>

        <LogoutButton />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },

  page: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f3f4f6",
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    textAlign: "center",
    marginTop: 34,
  },

  subtitle: {
    textAlign: "center",
    color: "#6b7280",
    marginBottom: 24,
  },

  section: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2563eb",
    marginBottom: 12,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  primaryCard: {
    backgroundColor: "#2563eb",
  },

  cardLabel: {
    color: "#6b7280",
    fontSize: 13,
  },

  cardValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginTop: 4,
  },

  primaryLabel: {
    color: "#dbeafe",
    fontSize: 13,
  },

  primaryValue: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 6,
  },

  row: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },

  smallCard: {
    flex: 1,
    minWidth: "30%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 10,
  },

  lightButton: {
    backgroundColor: "#dbeafe",
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 12,
  },

  lightButtonText: {
    color: "#1e3a8a",
    fontSize: 16,
    fontWeight: "600",
  },

  primaryButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 12,
  },

  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
  },
});
