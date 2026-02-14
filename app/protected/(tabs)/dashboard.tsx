import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { collection, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import AnimatedCounter from "../../../components/AnimatedCounter";

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { db } from "../../../firebaseConfig";

export default function Dashboard() {
  const insets = useSafeAreaInsets();

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
        contentContainerStyle={[
          styles.page,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        <Text style={styles.title}>Gym Dashboard</Text>
        <Text style={styles.subtitle}>Monthly Overview</Text>

        {/* HERO TOTAL REVENUE */}
        <LinearGradient
          colors={["#3b82f6", "#1d4ed8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Text style={styles.heroLabel}>Total Revenue</Text>
          <AnimatedCounter
            value={totalRevenue}
            prefix="₹"
            style={styles.heroValue}
          />
        </LinearGradient>

        {/* Revenue Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue Breakdown</Text>

          <View style={styles.cardRow}>
            <View style={styles.modernCard}>
              <Text style={styles.cardLabel}>Membership</Text>
              <AnimatedCounter
                value={membershipRevenue}
                prefix="₹"
                style={styles.cardValue}
              />
            </View>

            <View style={styles.modernCard}>
              <Text style={styles.cardLabel}>Registration</Text>
              <AnimatedCounter
                value={registrationRevenue}
                prefix="₹"
                style={styles.cardValue}
              />
            </View>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Methods</Text>

          <View style={styles.cardRow}>
            <View style={styles.modernCard}>
              <Text style={styles.cardLabel}>Cash</Text>
              <AnimatedCounter
                value={cashTotal}
                prefix="₹"
                style={styles.cardValue}
              />
            </View>

            <View style={styles.modernCard}>
              <Text style={styles.cardLabel}>UPI</Text>
              <AnimatedCounter
                value={upiTotal}
                prefix="₹"
                style={styles.cardValue}
              />
            </View>

            <View style={styles.modernCard}>
              <Text style={styles.cardLabel}>Online</Text>
              <AnimatedCounter
                value={onlineTotal}
                prefix="₹"
                style={styles.cardValue}
              />
            </View>
          </View>
        </View>

        {/* Members */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Members</Text>

          <View style={styles.cardRow}>
            <View style={styles.modernCard}>
              <Text style={styles.cardLabel}>Active</Text>
              <AnimatedCounter value={activeMembers} style={styles.cardValue} />
            </View>

            <View style={styles.modernCard}>
              <Text style={styles.cardLabel}>Archived</Text>
              <AnimatedCounter
                value={archivedMembers}
                style={styles.cardValue}
              />
            </View>
          </View>

          <View style={styles.cardRow}>
            <View style={styles.modernCard}>
              <Text style={styles.cardLabel}>Joined This Month</Text>
              <AnimatedCounter
                value={joinedThisMonth}
                style={styles.cardValue}
              />
            </View>

            <View style={styles.modernCard}>
              <Text style={styles.cardLabel}>Due Today</Text>
              <AnimatedCounter value={dueToday} style={styles.cardValue} />
            </View>

            <View style={[styles.modernCard, { marginRight: 0 }]}>
              <Text style={styles.cardLabel}>Overdue</Text>
              <AnimatedCounter
                value={overdueCount}
                style={[styles.cardValue, { color: "#dc2626" }]}
              />
            </View>
          </View>
        </View>

        {/* Buttons */}
      </ScrollView>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/protected/add-member")}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>＋</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    backgroundColor: "#2563eb",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
  },

  fabIcon: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700",
  },

  page: {
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    color: "#0f172a",
  },
  subtitle: {
    textAlign: "center",
    color: "#64748b",
    marginBottom: 20,
  },
  heroCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  heroLabel: {
    color: "#dbeafe",
    fontSize: 14,
  },
  heroValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    marginTop: 8,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 14,
    color: "#2563eb",
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  fabText: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "700",
  },

  modernCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
    marginRight: 10,
  },

  cardLabel: {
    fontSize: 12,
    color: "#64748b",
  },
  cardValue: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 6,
    color: "#0f172a",
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 14,
  },
  primaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#e2e8f0",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 14,
  },
  secondaryText: {
    color: "#1e293b",
    fontSize: 16,
    fontWeight: "600",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
});
