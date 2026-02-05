import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { collection, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../firebaseConfig";

import { BarChart } from "react-native-chart-kit";

export default function MonthlyReport() {
  const exportToPDF = async () => {
    const html = `
    <html>
      <body style="font-family: Arial; padding: 20px;">
        <h2>Monthly Report</h2>
        <h3>${new Date(selectedYear, selectedMonth).toLocaleString("default", {
          month: "long",
          year: "numeric",
        })}</h3>

        <p><strong>Membership Revenue:</strong> ₹${membershipRevenue}</p>
        <p><strong>Registration Revenue:</strong> ₹${registrationRevenue}</p>
        <p><strong>Total Revenue:</strong> ₹${membershipRevenue + registrationRevenue}</p>

        <hr />

        <p><strong>Cash:</strong> ₹${cashTotal}</p>
        <p><strong>UPI:</strong> ₹${upiTotal}</p>
        <p><strong>Online:</strong> ₹${onlineTotal}</p>

        <hr />

        <p><strong>Paid Members:</strong> ${paidMembers.length}</p>
        <p><strong>Unpaid Members:</strong> ${unpaidMembers.length}</p>
      </body>
    </html>
  `;

    const { uri } = await Print.printToFileAsync({ html });

    await Sharing.shareAsync(uri);
  };

  const [membershipRevenue, setMembershipRevenue] = useState(0);
  const [registrationRevenue, setRegistrationRevenue] = useState(0);
  const [cashTotal, setCashTotal] = useState(0);
  const [upiTotal, setUpiTotal] = useState(0);
  const [onlineTotal, setOnlineTotal] = useState(0);
  const [paidMembers, setPaidMembers] = useState<any[]>([]);
  const [unpaidMembers, setUnpaidMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const screenWidth = Dimensions.get("window").width;

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
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
              paidDate.getMonth() === selectedMonth &&
              paidDate.getFullYear() === selectedYear
            ) {
              if (data.type === "membership") {
                membership += Number(data.amount);
              }

              if (data.type === "registration") {
                registration += Number(data.amount);
              }

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
        const paid: any[] = [];
        const unpaid: any[] = [];

        const today = new Date();

        snapshot.forEach((doc) => {
          const data = doc.data();

          if (data.nextDueDate?.seconds) {
            const dueDate = new Date(data.nextDueDate.seconds * 1000);

            if (today <= dueDate) {
              paid.push({ id: doc.id, ...data });
            } else {
              unpaid.push({ id: doc.id, ...data });
            }
          } else {
            unpaid.push({ id: doc.id, ...data });
          }
        });

        setPaidMembers(paid);
        setUnpaidMembers(unpaid);
        setLoading(false);
      },
    );

    return () => {
      unsubscribePayments();
      unsubscribeMembers();
    };
  }, [selectedMonth, selectedYear]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  const totalRevenue = membershipRevenue + registrationRevenue;

  return (
    <View style={styles.container}>
      {/* Month Navigation */}
      <View style={styles.monthContainer}>
        <TouchableOpacity
          style={styles.monthButton}
          onPress={() => {
            let newMonth = selectedMonth - 1;
            let newYear = selectedYear;

            if (newMonth < 0) {
              newMonth = 11;
              newYear -= 1;
            }

            setSelectedMonth(newMonth);
            setSelectedYear(newYear);
          }}
        >
          <Text style={styles.monthText}>Previous</Text>
        </TouchableOpacity>

        <Text style={styles.monthLabel}>
          {new Date(selectedYear, selectedMonth).toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </Text>

        <TouchableOpacity
          style={styles.monthButton}
          onPress={() => {
            let newMonth = selectedMonth + 1;
            let newYear = selectedYear;

            if (newMonth > 11) {
              newMonth = 0;
              newYear += 1;
            }

            setSelectedMonth(newMonth);
            setSelectedYear(newYear);
          }}
        >
          <Text style={styles.monthText}>Next</Text>
        </TouchableOpacity>
      </View>

      {/* Revenue Breakdown */}
      <Text style={styles.header}>
        Membership Revenue: ₹{membershipRevenue}
      </Text>

      <Text style={styles.header}>
        Registration Revenue: ₹{registrationRevenue}
      </Text>

      <Text style={styles.header}>Total Revenue: ₹{totalRevenue}</Text>
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Revenue Breakdown</Text>

        <BarChart
          data={{
            labels: ["Membership", "Registration"],
            datasets: [
              {
                data: [membershipRevenue, registrationRevenue],
              },
            ],
          }}
          width={screenWidth - 30}
          height={220}
          yAxisLabel="₹"
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: "#1c1c1c",
            backgroundGradientFrom: "#1c1c1c",
            backgroundGradientTo: "#1c1c1c",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
            labelColor: () => "#fff",
          }}
          style={{
            borderRadius: 16,
          }}
        />
      </View>
      <View style={{ marginTop: 20 }}>
        <TouchableOpacity
          style={[styles.exportButton, { backgroundColor: "#4CAF50" }]}
          onPress={exportToPDF}
        >
          <Text style={styles.exportText}>Download PDF</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Payment Mode Distribution</Text>

        <BarChart
          data={{
            labels: ["Cash", "UPI", "Online"],
            datasets: [
              {
                data: [cashTotal, upiTotal, onlineTotal],
              },
            ],
          }}
          width={screenWidth - 30}
          height={220}
          yAxisLabel="₹"
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: "#1c1c1c",
            backgroundGradientFrom: "#1c1c1c",
            backgroundGradientTo: "#1c1c1c",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
            labelColor: () => "#fff",
          }}
          style={{
            borderRadius: 16,
          }}
        />
      </View>

      <View style={styles.breakdown}>
        <Text style={styles.summary}>Cash: ₹{cashTotal}</Text>
        <Text style={styles.summary}>UPI: ₹{upiTotal}</Text>
        <Text style={styles.summary}>Online: ₹{onlineTotal}</Text>
      </View>

      <Text style={styles.summary}>Paid Members: {paidMembers.length}</Text>
      <Text style={styles.summary}>Unpaid Members: {unpaidMembers.length}</Text>

      <Text style={styles.subHeader}>Unpaid Members</Text>

      <FlatList
        data={unpaidMembers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={[styles.name, { color: "red" }]}>{item.name}</Text>
            <Text style={styles.text}>
              Membership Fee: ₹{item.membershipFee}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 15 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  monthContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  monthButton: {
    backgroundColor: "#333",
    padding: 8,
    borderRadius: 6,
  },
  monthText: { color: "#fff" },
  monthLabel: { color: "#fff", fontSize: 16 },
  header: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 5,
  },
  breakdown: {
    marginBottom: 10,
  },
  summary: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 3,
  },
  subHeader: {
    color: "#2196F3",
    fontSize: 16,
    marginTop: 10,
    marginBottom: 5,
  },
  card: {
    backgroundColor: "#1c1c1c",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  text: {
    color: "#ccc",
  },
  chartContainer: {
    marginTop: 20,
    alignItems: "center",
  },

  chartTitle: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 10,
  },
  exportButton: {
    backgroundColor: "#2196F3",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },

  exportText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
