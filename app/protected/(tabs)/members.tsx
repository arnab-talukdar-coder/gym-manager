import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
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
import { db } from "../../../firebaseConfig";

export default function Members() {
  const [members, setMembers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const insets = useSafeAreaInsets();

  const [deleteModal, setDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<any>(null);

  const [paymentModal, setPaymentModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [amount, setAmount] = useState("");

  /* FETCH MEMBERS */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "members"), (snapshot) => {
      let list: any[] = [];

      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() });
      });

      // 🔥 SORT BY createdAt LOCALLY
      list.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        console.log(a.createdAt+" lll")
        return a.createdAt.seconds - b.createdAt.seconds; // old first, new last
      });

      setMembers(list);
      setFiltered(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  /* SEARCH */
  useEffect(() => {
    let list = [...members];
    if (search) {
      list = list.filter(
        (m) =>
          m.name?.toLowerCase().includes(search.toLowerCase()) ||
          m.phone?.includes(search)
      );
    }
    setFiltered(list);
  }, [search, members]);

  const formatDate = (timestamp: any) => {
    if (!timestamp?.seconds) return "—";
    return new Date(timestamp.seconds * 1000).toDateString();
  };

  const getBillingStatus = (member: any) => {
    if (!member.nextDueDate?.seconds) return "Active";

    const today = new Date();
    const due = new Date(member.nextDueDate.seconds * 1000);
    const diffDays = Math.floor(
      (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) return "OVERDUE";
    if (diffDays === 0) return "DUE TODAY";
    if (diffDays <= 3) return "DUE SOON";
    return "Active";
  };

  const makeCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const openWhatsApp = (phone: string) => {
    const formatted = phone.startsWith("+91") ? phone : `+91${phone}`;
    Linking.openURL(`https://wa.me/${formatted}`);
  };

  /* PAYMENT */
  const openPayment = (member: any, method: string) => {
    setSelectedMember(member);
    setPaymentMethod(method);
    setAmount(member.membershipFee?.toString() || "");
    setPaymentModal(true);
  };

  const processPayment = async () => {
    if (!selectedMember) return;

    const payAmount = Number(amount);
    if (!payAmount || payAmount <= 0) {
      Alert.alert("Invalid amount");
      return;
    }

    const today = new Date();

    let baseDate;

    if (selectedMember.nextDueDate?.seconds) {
      // 🔥 Always extend from last due date
      baseDate = new Date(selectedMember.nextDueDate.seconds * 1000);
    } else {
      // If no due date exists
      baseDate = today;
    }

    const nextDue = new Date(baseDate);
    nextDue.setMonth(nextDue.getMonth() + 1);

    try {
      // Save payment
      await addDoc(collection(db, "payments"), {
        memberId: selectedMember.id,
        memberName: selectedMember.name,
        amount: payAmount,
        paidOn: today,
        method: paymentMethod,
        type: "membership",
      });

      // Update member
      await updateDoc(doc(db, "members", selectedMember.id), {
        lastPaidDate: today,
        nextDueDate: nextDue,
        status: "active",
      });

      setPaymentModal(false);
      Alert.alert("Payment Recorded");
    } catch (error) {
      console.log(error);
      Alert.alert("Payment failed");
    }
  };

  /* DELETE */
  const confirmDelete = async () => {
    if (!memberToDelete) return;

    await deleteDoc(doc(db, "members", memberToDelete.id));
    setDeleteModal(false);
    setMemberToDelete(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <TextInput
          placeholder="Search..."
          value={search}
          onChangeText={setSearch}
          style={styles.search}
        />

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => {
            const billing = getBillingStatus(item);

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.phone}>📞 {item.phone}</Text>
                  </View>

                  <View style={styles.iconRow}>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => openWhatsApp(item.phone)}
                    >
                      <Ionicons
                        name="logo-whatsapp"
                        size={20}
                        color="#16a34a"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => makeCall(item.phone)}
                    >
                      <Ionicons name="call" size={20} color="#16a34a" />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.info}>
                  Next Due: {formatDate(item.nextDueDate)}
                </Text>
                <Text style={styles.info}>
                  Last Paid: {formatDate(item.lastPaidDate)}
                </Text>

                <View
                  style={[
                    styles.badge,
                    billing === "OVERDUE"
                      ? styles.badgeRed
                      : billing === "DUE SOON"
                      ? styles.badgeOrange
                      : styles.badgeGreen,
                  ]}
                >
                  <Text style={styles.badgeText}>{billing}</Text>
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.smallBtn, styles.cashBtn]}
                    onPress={() => openPayment(item, "cash")}
                  >
                    <Text style={styles.smallText}>Cash</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.smallBtn, styles.upiBtn]}
                    onPress={() => openPayment(item, "upi")}
                  >
                    <Text style={styles.smallText}>UPI</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.smallBtn, styles.deleteBtn]}
                    onPress={() => {
                      setMemberToDelete(item);
                      setDeleteModal(true);
                    }}
                  >
                    <Text style={styles.smallText}>Delete</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.editFullBtn}
                  onPress={() =>
                    router.push({
                      pathname: "/protected/edit-member",
                      params: { id: item.id },
                    })
                  }
                >
                  <Text style={styles.editFullText}>Edit Member</Text>
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
            );
          }}
        />

        {/* PAYMENT MODAL */}
        <Modal visible={paymentModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Enter Payment Amount</Text>

              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                style={styles.modalInput}
              />

              <View style={styles.modalRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setPaymentModal(false)}
                >
                  <Text>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={processPayment}
                >
                  <Text style={{ color: "#fff" }}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* DELETE MODAL */}
        <Modal visible={deleteModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>
                Delete {memberToDelete?.name}?
              </Text>

              <View style={styles.modalRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setDeleteModal(false)}
                >
                  <Text>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteConfirmBtn}
                  onPress={confirmDelete}
                >
                  <Text style={{ color: "#fff" }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <TouchableOpacity
          style={[styles.fab, { bottom: 20 + insets.bottom }]}
          onPress={() => router.push("/protected/add-member")}
        >
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* ================== STYLES ================== */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f3f4f6", paddingTop: -50 },
  container: { flex: 1, paddingHorizontal: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  search: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 12,
  },

  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 16,
    marginBottom: 14,
    elevation: 3,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  name: { fontSize: 16, fontWeight: "700" },
  phone: { marginTop: 4, color: "#2563eb", fontSize: 13 },
  info: { marginTop: 4, color: "#6b7280", fontSize: 12 },

  iconRow: { flexDirection: "row", gap: 8 },
  iconBtn: {
    backgroundColor: "#f3f4f6",
    padding: 10,
    borderRadius: 20,
  },

  badge: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },

  badgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  badgeGreen: { backgroundColor: "#16a34a" },
  badgeRed: { backgroundColor: "#dc2626" },
  badgeOrange: { backgroundColor: "#f97316" },

  buttonRow: {
    flexDirection: "row",
    marginTop: 10,
  },

  smallBtn: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: "center",
  },

  smallText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  cashBtn: { backgroundColor: "#16a34a" },
  upiBtn: { backgroundColor: "#2563eb" },
  deleteBtn: { backgroundColor: "#dc2626" },

  editFullBtn: {
    marginTop: 10,
    backgroundColor: "#e0f2fe",
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
  },

  editFullText: {
    color: "#0369a1",
    fontSize: 13,
    fontWeight: "600",
  },

  historyBtn: {
    marginTop: 8,
    backgroundColor: "#ede9fe",
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
  },

  historyText: {
    color: "#5b21b6",
    fontSize: 13,
    fontWeight: "600",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  modal: {
    backgroundColor: "#fff",
    width: "85%",
    padding: 20,
    borderRadius: 16,
  },

  modalTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },

  modalInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },

  modalRow: { flexDirection: "row", justifyContent: "space-between" },

  cancelBtn: { padding: 10 },

  confirmBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 10,
  },

  deleteConfirmBtn: {
    backgroundColor: "#dc2626",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 10,
  },

  fab: {
    position: "absolute",
    right: 20,
    backgroundColor: "#2563eb",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },
});
