import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { collection, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BarChart } from "react-native-chart-kit";
import { db } from "../../firebaseConfig";

export default function MonthlyReport() {
  const screenWidth = Dimensions.get("window").width;

  const [membershipRevenue, setMembershipRevenue] = useState(0);
  const [registrationRevenue, setRegistrationRevenue] = useState(0);
  const [cashTotal, setCashTotal] = useState(0);
  const [upiTotal, setUpiTotal] = useState(0);
  const [onlineTotal, setOnlineTotal] = useState(0);
  const [paidMembers, setPaidMembers] = useState<any[]>([]);
  const [unpaidMembers, setUnpaidMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const exportToPDF = async () => {
    try {
      const monthLabel = new Date(selectedYear, selectedMonth).toLocaleString(
        "default",
        {
          month: "long",
          year: "numeric",
        },
      );

      const totalRevenue = membershipRevenue + registrationRevenue;

      const html = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial;
              padding: 40px;
            }
            h1 {
              text-align: center;
              color: #2563eb;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            td {
              padding: 10px 0;
            }
            .total {
              font-weight: bold;
              border-top: 1px solid #000;
              padding-top: 10px;
            }
          </style>
        </head>

        <body>
          <h1>The Fitness Junction</h1>
          <h2 style="text-align:center;">Monthly Revenue Report</h2>
          <h3 style="text-align:center;">${monthLabel}</h3>

          <table>
            <tr>
              <td>Membership Revenue</td>
              <td align="right">₹${membershipRevenue}</td>
            </tr>
            <tr>
              <td>Registration Revenue</td>
              <td align="right">₹${registrationRevenue}</td>
            </tr>
            <tr>
              <td>Cash Revenue</td>
              <td align="right">₹${cashTotal}</td>
            </tr>
            <tr>
              <td>UPI Revenue</td>
              <td align="right">₹${upiTotal}</td>
            </tr>
            <tr>
              <td>Online Revenue</td>
              <td align="right">₹${onlineTotal}</td>
            </tr>
            <tr class="total">
              <td>Total Revenue</td>
              <td align="right">₹${totalRevenue}</td>
            </tr>
          </table>

          <br/><br/>

          <p><strong>Paid Members:</strong> ${paidMembers.length}</p>
          <p><strong>Unpaid Members:</strong> ${unpaidMembers.length}</p>

          <br/><br/>
          <p style="text-align:center; font-size:12px; color:gray;">
            Generated automatically by TFJ Gym Manager
          </p>
        </body>
      </html>
    `;

      const file = await Print.printToFileAsync({
        html,
        margins: {
          left: 20,
          right: 20,
          top: 20,
          bottom: 20,
        },
      });

      if (!file?.uri) return;

      await Sharing.shareAsync(file.uri, {
        mimeType: "application/pdf",
        dialogTitle: "Download Monthly Report",
      });
    } catch (error) {
      console.log("PDF error:", error);
    }
  };

  useEffect(() => {
    const unsubPayments = onSnapshot(collection(db, "payments"), (snapshot) => {
      let membership = 0;
      let registration = 0;
      let cash = 0;
      let upi = 0;
      let online = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.paidOn?.seconds) return;

        const d = new Date(data.paidOn.seconds * 1000);
        if (
          d.getMonth() === selectedMonth &&
          d.getFullYear() === selectedYear
        ) {
          if (data.type === "membership") membership += Number(data.amount);
          if (data.type === "registration") registration += Number(data.amount);
          if (data.method === "cash") cash += Number(data.amount);
          if (data.method === "upi") upi += Number(data.amount);
          if (data.method === "online") online += Number(data.amount);
        }
      });

      setMembershipRevenue(membership);
      setRegistrationRevenue(registration);
      setCashTotal(cash);
      setUpiTotal(upi);
      setOnlineTotal(online);
    });

    const unsubMembers = onSnapshot(collection(db, "members"), (snapshot) => {
      const paid: any[] = [];
      const unpaid: any[] = [];
      const today = new Date();

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.nextDueDate?.seconds) {
          const due = new Date(data.nextDueDate.seconds * 1000);
          today <= due
            ? paid.push({ id: doc.id, ...data })
            : unpaid.push({ id: doc.id, ...data });
        } else {
          unpaid.push({ id: doc.id, ...data });
        }
      });

      setPaidMembers(paid);
      setUnpaidMembers(unpaid);
      setLoading(false);
    });

    return () => {
      unsubPayments();
      unsubMembers();
    };
  }, [selectedMonth, selectedYear]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  const totalRevenue = membershipRevenue + registrationRevenue;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={unpaidMembers}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListHeaderComponent={
          <>
            {/* Month Selector */}
            <View style={styles.monthRow}>
              <TouchableOpacity
                style={styles.monthBtn}
                onPress={() => {
                  let m = selectedMonth - 1;
                  let y = selectedYear;
                  if (m < 0) {
                    m = 11;
                    y--;
                  }
                  setSelectedMonth(m);
                  setSelectedYear(y);
                }}
              >
                <Text style={styles.monthBtnText}>Previous</Text>
              </TouchableOpacity>

              <Text style={styles.monthLabel}>
                {new Date(selectedYear, selectedMonth).toLocaleString(
                  "default",
                  {
                    month: "long",
                    year: "numeric",
                  },
                )}
              </Text>

              <TouchableOpacity
                style={styles.monthBtn}
                onPress={() => {
                  let m = selectedMonth + 1;
                  let y = selectedYear;
                  if (m > 11) {
                    m = 0;
                    y++;
                  }
                  setSelectedMonth(m);
                  setSelectedYear(y);
                }}
              >
                <Text style={styles.monthBtnText}>Next</Text>
              </TouchableOpacity>
            </View>

            {/* Summary */}
            <View style={styles.card}>
              <Text style={styles.text}>Membership: ₹{membershipRevenue}</Text>
              <Text style={styles.text}>
                Registration: ₹{registrationRevenue}
              </Text>
              <Text style={styles.total}>Total Revenue: ₹{totalRevenue}</Text>
            </View>

            {/* Revenue Chart */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Revenue Breakdown</Text>
              <BarChart
                data={{
                  labels: ["Membership", "Registration"],
                  datasets: [
                    { data: [membershipRevenue, registrationRevenue] },
                  ],
                }}
                width={screenWidth - 32}
                height={220}
                yAxisLabel="₹"
                yAxisSuffix="" // ✅ REQUIRED
                chartConfig={chartBlue}
                style={{ borderRadius: 12 }}
              />
            </View>

            <TouchableOpacity style={styles.exportButton} onPress={exportToPDF}>
              <Text style={styles.exportText}>Download PDF</Text>
            </TouchableOpacity>
            <View style={styles.card}>
              <Text style={styles.chartTitle}>Payment Mode Revenue</Text>

              <View style={{ marginTop: 8 }}>
                <Text style={styles.text}>Cash Revenue: ₹{cashTotal}</Text>
                <Text style={styles.text}>UPI Revenue: ₹{upiTotal}</Text>
                <Text style={styles.text}>Online Revenue: ₹{onlineTotal}</Text>
              </View>
            </View>
            {/* Payment Mode Chart */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Payment Mode</Text>
              <BarChart
                data={{
                  labels: ["Cash", "UPI", "Online"],
                  datasets: [{ data: [cashTotal, upiTotal, onlineTotal] }],
                }}
                width={screenWidth - 32}
                height={220}
                yAxisLabel="₹"
                yAxisSuffix="" // ✅ REQUIRED
                chartConfig={chartGreen}
                style={{ borderRadius: 12 }}
              />
            </View>

            <Text style={styles.subHeader}>Unpaid Members</Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.memberCard}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.text}>
              Membership Fee: ₹{item.membershipFee}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const chartBlue = {
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  decimalPlaces: 0,
  color: (o = 1) => `rgba(37, 99, 235, ${o})`,
  labelColor: () => "#374151",
};

const chartGreen = {
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  decimalPlaces: 0,
  color: (o = 1) => `rgba(22, 163, 74, ${o})`,
  labelColor: () => "#374151",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    padding: 16,
    paddingTop: 60,
  },
  center: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  monthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  monthBtn: {
    backgroundColor: "#dbeafe",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  monthBtnText: {
    color: "#1e3a8a",
    fontWeight: "600",
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
  },
  text: {
    color: "#374151",
    fontSize: 14,
  },
  total: {
    marginTop: 6,
    color: "#2563eb",
    fontSize: 16,
    fontWeight: "700",
  },
  chartCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    alignItems: "center",
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 10,
  },
  exportButton: {
    backgroundColor: "#16a34a",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  exportText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
  subHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2563eb",
    marginBottom: 10,
  },
  memberCard: {
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  name: {
    color: "#dc2626",
    fontWeight: "700",
    fontSize: 16,
  },
});
