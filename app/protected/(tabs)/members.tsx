import { Ionicons } from "@expo/vector-icons";

import { router } from "expo-router";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  FlatList,
  LayoutAnimation,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";

import Swipeable, {
  SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { db } from "../../../firebaseConfig";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export default function Members() {
  const [members, setMembers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const insets = useSafeAreaInsets();
  const [deleteModal, setDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<any>(null);

  const [paymentModal, setPaymentModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [amount, setAmount] = useState("");

  const swipeRefs = useRef<Record<string, SwipeableMethods | null>>({});

  /* ---------------- FETCH ---------------- */

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "members"), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setMembers(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  /* ---------------- FILTER ---------------- */
  useEffect(() => {
    let list = [...members];

    const today = new Date();

    list = list.filter((m) => {
      if (!m.nextDueDate?.seconds) return true;

      const due = new Date(m.nextDueDate.seconds * 1000);

      const todayDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );

      const dueDate = new Date(
        due.getFullYear(),
        due.getMonth(),
        due.getDate(),
      );

      const diffDays =
        (dueDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24);

      switch (filter) {
        case "active":
          return diffDays > 3;

        case "dueToday":
          return diffDays === 0;

        case "overdue":
          return diffDays < 0;

        case "dueSoon":
          return diffDays > 0 && diffDays <= 3;

        default:
          return true;
      }
    });

    if (search) {
      list = list.filter(
        (m) =>
          m.name?.toLowerCase().includes(search.toLowerCase()) ||
          m.phone?.includes(search),
      );
    }

    list.sort((a, b) => {
      const aDate = a.nextDueDate?.seconds || 0;
      const bDate = b.nextDueDate?.seconds || 0;
      return aDate - bDate;
    });

    setFiltered(list);
  }, [members, search, filter]);

  /* ---------------- HELPERS ---------------- */
  const makeCall = (phone: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  const openWhatsApp = (phone: string) => {
    if (!phone) return;

    const formatted = phone.startsWith("+91") ? phone : `+91${phone}`;

    Linking.openURL(`https://wa.me/${formatted}`);
  };

  const showContactOptions = (phone: string) => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Call", "WhatsApp"],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) makeCall(phone);
          if (buttonIndex === 2) openWhatsApp(phone);
        },
      );
    } else {
      Alert.alert("Contact Options", "Choose action", [
        { text: "Call", onPress: () => makeCall(phone) },
        { text: "WhatsApp", onPress: () => openWhatsApp(phone) },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp?.seconds) return "—";
    return new Date(timestamp.seconds * 1000).toDateString();
  };

  const getBillingStatus = (member: any) => {
    if (!member.nextDueDate?.seconds) return "Active";

    const today = new Date();
    const due = new Date(member.nextDueDate.seconds * 1000);

    const isSameDay =
      due.getFullYear() === today.getFullYear() &&
      due.getMonth() === today.getMonth() &&
      due.getDate() === today.getDate();

    const isPast =
      new Date(due.getFullYear(), due.getMonth(), due.getDate()) <
      new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const diffDays = Math.floor(
      (new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime() -
        new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
        ).getTime()) /
        (1000 * 60 * 60 * 24),
    );

    if (isPast) return "OVERDUE";
    if (isSameDay) return "DUE TODAY";
    if (diffDays <= 3) return "DUE SOON";

    return "Active";
  };

  /* ---------------- PAYMENT ---------------- */

  const openPayment = (member: any, method: string) => {
    swipeRefs.current[member.id]?.close();
    setSelectedMember(member);
    setPaymentMethod(method);
    setAmount(member.membershipFee?.toString() || "");
    setPaymentModal(true);
  };

  const processPayment = async () => {
    try {
      const payAmount = Number(amount);
      if (!payAmount || payAmount <= 0) {
        Alert.alert("Invalid amount");
        return;
      }

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      const today = new Date();
      const baseDate = selectedMember.nextDueDate?.seconds
        ? new Date(selectedMember.nextDueDate.seconds * 1000)
        : today;

      const nextDue = new Date(baseDate);
      nextDue.setMonth(nextDue.getMonth() + 1);

      await addDoc(collection(db, "payments"), {
        memberId: selectedMember.id,
        memberName: selectedMember.name, // 🔥 Add this
        amount: payAmount,
        paidOn: today,
        method: paymentMethod,
        type: "membership",
      });

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

  /* ---------------- DELETE ---------------- */

  const deleteMember = (member: any) => {
    console.log("Delete", member.name);
    swipeRefs.current[member.id]?.close();
    setMemberToDelete(member);
    setDeleteModal(true);
  };

  const closeDeleteModal = () => {
    if (memberToDelete) {
      swipeRefs.current[memberToDelete.id]?.current?.close();
    }

    setDeleteModal(false);
    setMemberToDelete(null);
  };

  const confirmDelete = async () => {
    try {
      if (!memberToDelete) return;

      await deleteDoc(doc(db, "members", memberToDelete.id));

      setDeleteModal(false);
      setMemberToDelete(null);
    } catch (error) {
      console.log("Delete Error:", error);
    }
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
      <View style={[styles.container, { paddingBottom: insets.bottom + 80 }]}>
        <TextInput
          placeholder="Search..."
          value={search}
          onChangeText={setSearch}
          style={styles.search}
        />
        <View style={styles.filterRow}>
          {[
            { label: "All", value: "all" },
            { label: "Active", value: "active" },
            { label: "Due Today", value: "dueToday" },
            { label: "Due Soon", value: "dueSoon" },
            { label: "Overdue", value: "overdue" },
          ].map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.filterBtn,
                filter === item.value && styles.filterBtnActive,
              ]}
              onPress={() => setFilter(item.value)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === item.value && styles.filterTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            if (!swipeRefs.current[item.id]) {
              swipeRefs.current[item.id] =
                React.createRef<SwipeableMethods | null>();
            }

            const billing = getBillingStatus(item);

            return (
              <View style={styles.swipeWrapper}>
                <Swipeable
                  ref={(ref) => {
                    if (ref) {
                      swipeRefs.current[item.id] = ref;
                    }
                  }}
                  overshootLeft={false}
                  overshootRight={false}
                  onSwipeableOpen={(direction) => {
                    if (direction === "right") {
                      deleteMember(item);
                    }
                  }}
                  renderRightActions={(progress, dragX) => (
                    <View style={styles.rightActions}>
                      <TouchableOpacity
                        style={styles.cashBtn}
                        onPress={() => openPayment(item, "cash")}
                      >
                        <Text style={styles.swipeText}>Cash</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.upiBtn}
                        onPress={() => openPayment(item, "upi")}
                      >
                        <Text style={styles.swipeText}>UPI</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  renderLeftActions={(progress, dragX) => (
                    <View style={styles.leftActionContainer}>
                      <View style={styles.deleteSwipe}>
                        <Text style={styles.swipeText}>Delete</Text>
                      </View>
                    </View>
                  )}
                >
                  <View style={styles.card}>
                    {/* Name */}
                    <View style={styles.cardHeader}>
                      <Text style={styles.name}>{item.name}</Text>

                      <View style={styles.iconRow}>
                        {/* WhatsApp */}
                        <TouchableOpacity
                          onPress={() => openWhatsApp(item.phone)}
                          onLongPress={() => showContactOptions(item.phone)}
                          style={styles.whatsappBtn}
                        >
                          <Ionicons
                            name="logo-whatsapp"
                            size={20}
                            color="#16a34a"
                          />
                        </TouchableOpacity>

                        {/* Call */}
                        <TouchableOpacity
                          onPress={() => makeCall(item.phone)}
                          onLongPress={() => showContactOptions(item.phone)}
                          style={styles.callBtn}
                        >
                          <Ionicons
                            name="call"
                            size={20}
                            color={
                              billing === "OVERDUE" ? "#dc2626" : "#16a34a"
                            }
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Phone */}
                    <Text style={styles.phone}>📞 {item.phone}</Text>

                    {/* Dates */}
                    <Text style={styles.info}>
                      Next Due: {formatDate(item.nextDueDate)}
                    </Text>
                    <Text style={styles.info}>
                      Last Paid: {formatDate(item.lastPaidDate)}
                    </Text>

                    {/* Status Row */}
                    <View style={styles.statusRow}>
                      {/* Billing Status */}
                      <View
                        style={[
                          styles.badge,
                          billing === "OVERDUE"
                            ? styles.badgeRed
                            : billing === "DUE TODAY"
                              ? styles.badgeRed
                              : billing === "DUE SOON"
                                ? styles.badgeOrange
                                : styles.badgeGreen,
                        ]}
                      >
                        <Text style={styles.badgeText}>{billing}</Text>
                      </View>

                      {/* Active / Archived */}
                      {/* <View
                        style={[
                          styles.badge,
                          item.status === "active"
                            ? styles.badgeGreen
                            : styles.badgeGray,
                        ]}
                      >
                        <Text style={styles.badgeText}>
                          {item.status?.toUpperCase()}
                        </Text>
                      </View> */}
                    </View>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() =>
                        router.push({
                          pathname: "/protected/edit-member",
                          params: { id: item.id },
                        })
                      }
                    >
                      <Text style={styles.editText}>Edit Member</Text>
                    </TouchableOpacity>
                    {/* Payment History Button */}

                    <TouchableOpacity
                      style={styles.historyBtn}
                      onPress={() =>
                        router.push({
                          pathname: "/protected/payment-history",
                          params: { memberId: item.id },
                        })
                      }
                    >
                      <Text style={styles.historyText}>
                        View Payment History
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Swipeable>
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

              <Text style={{ color: "#6b7280", marginBottom: 16 }}>
                This will permanently remove member and all payments.
              </Text>

              <View style={styles.modalRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={closeDeleteModal}
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
          style={styles.fab}
          onPress={() => router.push("/protected/add-member")}
        >
          <Text style={{ color: "#fff", fontSize: 24 }}>+</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f3f4f6" },
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  search: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    fontSize: 16,
  },

  swipeWrapper: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    elevation: 2,
  },

  leftActionContainer: {
    width: 100,
    justifyContent: "center",
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },

  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#e5e7eb",
    borderRadius: 20,
  },

  filterBtnActive: {
    backgroundColor: "#2563eb",
  },

  filterText: {
    fontSize: 12,
    fontWeight: "600",
  },

  filterTextActive: {
    color: "#fff",
  },

  deleteSwipe: {
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },

  name: { fontSize: 18, fontWeight: "700" },
  phone: { color: "#2563eb", marginTop: 4 },
  info: { marginTop: 4, color: "#6b7280" },
  status: { marginTop: 6, fontWeight: "700" },

  red: { color: "#dc2626" },
  green: { color: "#16a34a" },

  rightActions: {
    width: 160,
    flexDirection: "row",
  },
  iconRow: {
    flexDirection: "row",
    gap: 8,
  },

  callBtn: {
    backgroundColor: "#ecfdf5",
    padding: 8,
    borderRadius: 20,
  },

  whatsappBtn: {
    backgroundColor: "#f0fdf4",
    padding: 8,
    borderRadius: 20,
  },

  editBtn: {
    marginTop: 10,
    backgroundColor: "#e0f2fe",
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },

  editText: {
    color: "#0369a1",
    fontWeight: "700",
  },

  cashBtn: {
    flex: 1,
    backgroundColor: "#16a34a",
    justifyContent: "center",
    alignItems: "center",
  },

  upiBtn: {
    flex: 1,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
  },

  swipeText: { color: "#fff", fontWeight: "700" },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 40,
    backgroundColor: "#2563eb",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },

  modalInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },

  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  cancelBtn: { padding: 10 },

  confirmBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },

  deleteConfirmBtn: {
    backgroundColor: "#dc2626",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  statusRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },

  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },

  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  badgeGreen: {
    backgroundColor: "#16a34a",
  },

  badgeRed: {
    backgroundColor: "#dc2626",
  },

  badgeOrange: {
    backgroundColor: "#f97316",
  },

  badgeGray: {
    backgroundColor: "#6b7280",
  },

  historyBtn: {
    marginTop: 12,
    backgroundColor: "#ede9fe",
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },

  historyText: {
    color: "#5b21b6",
    fontWeight: "700",
  },
});
