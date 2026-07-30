import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Package,
  Users,
  BarChart3,
  Sparkles,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Clock,
  Layers,
  Power,
  Search,
  Filter,
  ShieldCheck,
  MessageSquarePlus,
  Send,
  X,
  FileText,
  Download,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  UserPlus,
  UserCheck,
  ChefHat,
  Trash2,
  Mail,
  Phone,
  User as UserIcon,
  Edit3
} from 'lucide-react';
import { FloorPlanEditor } from './FloorPlanEditor';
import { AIStaffScheduler } from './AIStaffScheduler';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  MenuItem,
  RestaurantTable,
  Order,
  InventoryItem,
  Bill,
  StaffShift,
  ShiftHandoverNote,
  AIInsights,
  User,
  UserRole
} from '../../types';
import {
  addMenuItem,
  toggleMenuItemAvailability,
  updateInventoryStock,
  fetchAIInsights,
  addShiftNote,
  updateUserRole,
  createStaffUser,
  deleteStaffUser
} from '../../lib/api';

interface ManagerDashboardProps {
  currentUser: User | null;
  users?: User[];
  menuItems: MenuItem[];
  tables: RestaurantTable[];
  orders: Order[];
  inventory: InventoryItem[];
  bills: Bill[];
  shifts: StaffShift[];
  shiftNotes: ShiftHandoverNote[];
  onEditUserProfile?: (user: User) => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  currentUser,
  users = [],
  menuItems,
  tables,
  orders,
  inventory,
  bills,
  shifts,
  shiftNotes,
  onEditUserProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'floorplan' | 'inventory' | 'staff' | 'analytics' | 'ai' | 'handover'>('orders');

  // Low Stock Toast Dismissal
  const [dismissedToast, setDismissedToast] = useState(false);
  const lowStockItems = inventory.filter((item) => item.stockQty <= item.lowStockThreshold);

  useEffect(() => {
    if (lowStockItems.length > 0) {
      setDismissedToast(false);
    }
  }, [lowStockItems.length]);

  // Agile User Roles & Staff Management State
  const [localUsers, setLocalUsers] = useState<User[]>(users || []);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [staffFilterRole, setStaffFilterRole] = useState<'all' | 'pending' | 'waiter' | 'kitchen' | 'manager' | 'unassigned'>('all');
  const [staffSuccessMsg, setStaffSuccessMsg] = useState<string | null>(null);

  // New Staff Modal State
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [addStaffName, setAddStaffName] = useState('');
  const [addStaffEmail, setAddStaffEmail] = useState('');
  const [addStaffRole, setAddStaffRole] = useState<UserRole>('waiter');
  const [addStaffPhone, setAddStaffPhone] = useState('');
  const [addStaffTables, setAddStaffTables] = useState('1, 2');

  useEffect(() => {
    if (users && users.length > 0) {
      setLocalUsers(users);
    }
  }, [users]);

  // Quick Role Change Handler
  const handleQuickRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const updated = await updateUserRole(userId, { role: newRole, status: 'active' });
      setLocalUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole, status: 'active' } : u)));
      setStaffSuccessMsg(`Updated ${updated.name}'s active job role to '${newRole.toUpperCase()}'.`);
      setTimeout(() => setStaffSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Failed to update role:', err);
    }
  };

  // Quick Status Change Handler
  const handleQuickStatusChange = async (userId: string, newStatus: any) => {
    try {
      const updated = await updateUserRole(userId, { status: newStatus });
      setLocalUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)));
      setStaffSuccessMsg(`Updated ${updated.name}'s status to '${newStatus}'.`);
      setTimeout(() => setStaffSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Approve Pending Staff Member Handler
  const handleApprovePendingStaff = async (staff: User) => {
    const targetRole =
      staff.requestedRole && staff.requestedRole !== 'unassigned'
        ? staff.requestedRole
        : staff.role !== 'unassigned'
        ? staff.role
        : 'waiter';
    try {
      const updated = await updateUserRole(staff.id, { role: targetRole, status: 'active' });
      setLocalUsers((prev) =>
        prev.map((u) => (u.id === staff.id ? { ...u, role: targetRole, status: 'active' } : u))
      );
      setStaffSuccessMsg(`Approved & activated ${updated.name} as ${targetRole.toUpperCase()}.`);
      setTimeout(() => setStaffSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Failed to approve staff:', err);
    }
  };

  // Update Waiter Table Assignment
  const handleUpdateWaiterTables = async (userId: string, currentTables: number[] = []) => {
    const input = window.prompt(
      'Enter assigned table numbers separated by commas (e.g. 1, 2, 3 or leave empty for All Floor):',
      currentTables.join(', ')
    );
    if (input === null) return;
    const tablesArr = input
      .split(',')
      .map((t) => Number(t.trim()))
      .filter((n) => !isNaN(n) && n > 0);
    try {
      const updated = await updateUserRole(userId, { assignedTables: tablesArr });
      setLocalUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, assignedTables: tablesArr } : u))
      );
      setStaffSuccessMsg(`Updated table assignments for ${updated.name}.`);
      setTimeout(() => setStaffSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Failed to update table assignments:', err);
    }
  };

  // Create New Staff Member Handler
  const handleCreateStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addStaffName || !addStaffEmail) return;
    try {
      const tablesArr = addStaffTables.split(',').map((t) => Number(t.trim())).filter((n) => !isNaN(n) && n > 0);
      const created = await createStaffUser({
        name: addStaffName,
        email: addStaffEmail,
        role: addStaffRole,
        phone: addStaffPhone,
        assignedTables: tablesArr,
      });
      setLocalUsers((prev) => [created, ...prev]);
      setShowAddStaffModal(false);
      setAddStaffName('');
      setAddStaffEmail('');
      setAddStaffPhone('');
      setStaffSuccessMsg(`Successfully created staff account for ${created.name} (${created.role.toUpperCase()})!`);
      setTimeout(() => setStaffSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Failed to create staff:', err);
    }
  };

  // Delete Staff Member Handler
  const handleDeleteStaff = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to remove ${userName} from staff list?`)) return;
    try {
      await deleteStaffUser(userId);
      setLocalUsers((prev) => prev.filter((u) => u.id !== userId));
      setStaffSuccessMsg(`Removed ${userName} from staff directory.`);
      setTimeout(() => setStaffSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Failed to delete staff:', err);
    }
  };

  // Derived user lists for agile role management
  const pendingUsers = localUsers.filter((u) => u.status === 'pending_approval' || u.role === 'unassigned');

  const filteredUsersList = localUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(staffSearchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (staffFilterRole === 'pending') {
      return u.status === 'pending_approval' || u.role === 'unassigned';
    }
    if (staffFilterRole !== 'all') {
      return u.role === staffFilterRole;
    }
    return true;
  });

  // Date Range Filter State for Daily Revenue Chart
  const [revenueTimeRange, setRevenueTimeRange] = useState<'7days' | '30days' | 'custom'>('7days');
  const [customStartDate, setCustomStartDate] = useState('2026-07-01');
  const [customEndDate, setCustomEndDate] = useState('2026-07-25');

  // Shift Handover Form State
  const [handoverNoteText, setHandoverNoteText] = useState('');
  const [handoverPriority, setHandoverPriority] = useState<'normal' | 'urgent'>('normal');

  // New Menu Item Form Modal
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [newDishName, setNewDishName] = useState('');
  const [newDishPrice, setNewDishPrice] = useState(18);
  const [newDishCategory, setNewDishCategory] = useState<'Appetizers' | 'Mains' | 'Desserts' | 'Beverages'>('Mains');
  const [newDishDesc, setNewDishDesc] = useState('');
  const [newDishPrepTime, setNewDishPrepTime] = useState(15);
  const [newDishIngredients, setNewDishIngredients] = useState('');
  const [newDishImageUrl, setNewDishImageUrl] = useState('');
  const [isSubmittingDish, setIsSubmittingDish] = useState(false);

  // AI Insights State
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [isAiFallback, setIsAiFallback] = useState(false);

  // Filter orders
  const [orderFilter, setOrderFilter] = useState<string>('all');

  // Export Daily Sales Records to CSV
  const handleDownloadCSV = () => {
    const filteredOrders = orders.filter((o) => orderFilter === 'all' || o.status === orderFilter);

    const headers = ['Order ID', 'Table Number', 'Status', 'Waiter', 'Customer Name', 'Guest Count', 'Total Amount ($)', 'Items Count', 'Created At'];
    const rows = filteredOrders.map((o) => [
      o.id,
      o.tableNumber,
      o.status,
      `"${(o.waiterName || '').replace(/"/g, '""')}"`,
      `"${(o.customerName || '').replace(/"/g, '""')}"`,
      o.guestCount,
      o.totalAmount,
      o.items.length,
      `"${new Date(o.createdAt).toLocaleString()}"`
    ]);

    const csvString = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `daily_sales_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Generate Executive Daily Report as Formatted PDF
  const handleGeneratePdfReport = () => {
    try {
      const doc = new jsPDF();
      const currentDateStr = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Title Banner Header
      doc.setFillColor(37, 99, 235); // #2563eb
      doc.rect(0, 0, 210, 32, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(17);
      doc.setFont('helvetica', 'bold');
      doc.text('KitchenSync - Executive Daily Operations Report', 14, 18);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${currentDateStr} at ${currentTimeStr} | Manager: ${currentUser?.name || 'Alex Rivera'}`, 14, 26);

      // Section 1: Executive KPI Metrics
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('1. Executive Daily Performance Summary', 14, 42);

      const completedOrders = orders.filter((o) => o.status === 'served' || o.status === 'billed').length;
      const avgTicket = orders.length > 0 ? (totalRevenueToday / orders.length).toFixed(2) : '0.00';
      const tableTurnoverRate = tables.length > 0 ? (orders.length / tables.length).toFixed(1) : '0.0';

      const kpiSummaryData = [
        ['Total Daily Sales Revenue', `$${totalRevenueToday.toLocaleString()}`, 'Ledger Active'],
        ['Active Orders In-Flight', `${activeOrdersCount}`, 'Live Floor State'],
        ['Completed Orders', `${completedOrders}`, 'Served / Billed'],
        ['Average Order Spend (Ticket)', `$${avgTicket}`, 'Target Benchmarked'],
        ['Table Seating Occupancy', `${occupancyPercentage}% (${occupiedTablesCount}/${tables.length} tables)`, 'Capacity Utilization'],
        ['Table Turnover Rate', `${tableTurnoverRate} turns/table`, 'Floor Flow Speed'],
        ['Inventory Stock Alerts', `${lowStockCount} items below threshold`, lowStockCount > 0 ? 'Requires Action' : 'Stock Nominal'],
      ];

      autoTable(doc, {
        startY: 46,
        head: [['Key Metric', 'Current Daily Value', 'Operational Status']],
        body: kpiSummaryData,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8.5, cellPadding: 3 },
      });

      const y1 = (doc as any).lastAutoTable?.finalY || 120;

      // Section 2: Top Selling Menu Dishes
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('2. Top-Performing Menu Dishes (Weekly Volume)', 14, y1 + 10);

      const itemRows = topMenuItemsData.map((item, idx) => [
        `#${idx + 1}`,
        item.name,
        item.category,
        `${item.quantitySold} units`,
        `$${item.totalRevenue.toLocaleString()}`,
      ]);

      autoTable(doc, {
        startY: y1 + 14,
        head: [['Rank', 'Dish Name', 'Category', 'Quantity Sold', 'Total Revenue']],
        body: itemRows,
        theme: 'striped',
        headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8.5, cellPadding: 3 },
      });

      const y2 = (doc as any).lastAutoTable?.finalY || 200;

      // Section 3: Kitchen Stock Audit
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('3. Essential Kitchen Stock & Inventory Audit', 14, y2 + 10);

      const inventoryRows = inventory.slice(0, 10).map((inv) => [
        inv.ingredientName,
        `${inv.stockQty} ${inv.unit}`,
        `${inv.lowStockThreshold} ${inv.unit}`,
        inv.stockQty <= inv.lowStockThreshold ? 'LOW STOCK - Action Needed' : 'Sufficient',
      ]);

      autoTable(doc, {
        startY: y2 + 14,
        head: [['Ingredient', 'Current Stock', 'Low Threshold', 'Stock Status']],
        body: inventoryRows,
        theme: 'grid',
        headStyles: { fillColor: [71, 85, 105], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2.5 },
      });

      // Page numbers footer
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(140);
        doc.text(
          `KitchenSync Unified Operations • Confidential Report • Page ${i} of ${totalPages}`,
          14,
          287
        );
      }

      doc.save(`KitchenSync_Daily_Executive_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF report:', err);
    }
  };

  // Calculate High-level Metrics
  const activeOrdersCount = orders.filter((o) => o.status !== 'billed' && o.status !== 'cancelled').length;
  const totalRevenueToday = bills.reduce((sum, b) => sum + b.totalAmount, 0) + orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const occupiedTablesCount = tables.filter((t) => t.status === 'Occupied').length;
  const occupancyPercentage = Math.round((occupiedTablesCount / tables.length) * 100);
  const lowStockCount = inventory.filter((i) => i.stockQty <= i.lowStockThreshold).length;

  // Handle Shift Handover Broadcast
  const handlePostHandoverNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverNoteText.trim()) return;
    await addShiftNote(
      currentUser?.name || 'General Manager',
      'manager',
      handoverNoteText,
      handoverPriority
    );
    setHandoverNoteText('');
  };

  // Handle New Menu Creation
  const handleCreateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDishName.trim() || !newDishPrice) return;
    setIsSubmittingDish(true);

    try {
      const created = await addMenuItem({
        name: newDishName.trim(),
        price: Number(newDishPrice),
        category: newDishCategory,
        description: newDishDesc.trim() || `${newDishName.trim()} prepared fresh to order.`,
        prepTimeMinutes: Number(newDishPrepTime) || 15,
        ingredients: newDishIngredients.split(',').map((s) => s.trim()).filter(Boolean),
        isAvailable: true,
        imageUrl: newDishImageUrl.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400',
      });

      setShowAddMenuModal(false);
      setNewDishName('');
      setNewDishPrice(18);
      setNewDishDesc('');
      setNewDishIngredients('');
      setNewDishImageUrl('');
      alert(`🎉 Successfully added "${created.name}" ($${created.price.toFixed(2)}) to Digital Menu!\nIt is now immediately available across Waitstaff POS, Kitchen KDS, and Customer QR Ordering.`);
    } catch (err) {
      console.error('Failed to create menu dish:', err);
      alert('Failed to add new dish to menu');
    } finally {
      setIsSubmittingDish(false);
    }
  };

  // Handle Toggle Item Availability
  const handleToggleItem = async (id: string) => {
    await toggleMenuItemAvailability(id);
  };

  // Handle Inventory Restock
  const handleRestock = async (id: string, currentStock: number) => {
    await updateInventoryStock(id, currentStock + 10);
  };

  // Fetch Platinum Gemini AI Insights
  const handleRunAiAudit = async () => {
    setLoadingAi(true);
    try {
      const res = await fetchAIInsights();
      setAiInsights(res.insights);
      setIsAiFallback(res.isFallback);
    } catch (err) {
      alert('Failed to generate AI insights');
    } finally {
      setLoadingAi(false);
    }
  };

  // Chart Data Preparation
  const categorySalesData = [
    { name: 'Mains', value: 480 },
    { name: 'Appetizers', value: 210 },
    { name: 'Beverages', value: 160 },
    { name: 'Desserts', value: 120 },
  ];

  const hourlyRevenueData = [
    { time: '12 PM', revenue: 240 },
    { time: '1 PM', revenue: 420 },
    { time: '2 PM', revenue: 310 },
    { time: '5 PM', revenue: 520 },
    { time: '6 PM', revenue: 890 },
    { time: '7 PM', revenue: 1240 },
    { time: '8 PM', revenue: 1100 },
    { time: '9 PM', revenue: 680 },
  ];

  // Dynamic Daily Revenue trend data for Recharts based on date range filter
  const dailyRevenueData = React.useMemo(() => {
    let numDays = 7;
    if (revenueTimeRange === '30days') numDays = 30;
    if (revenueTimeRange === 'custom') {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      numDays = Math.max(1, Math.min(60, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1));
    }

    const baselineSeed = [2850, 3400, 3100, 4200, 4850, 5300, 3900, 4100, 4600, 5100, 3200, 2900, 3700, 4500, 4900];

    return Array.from({ length: numDays }).map((_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - (numDays - 1 - idx));
      const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const seedVal = baselineSeed[idx % baselineSeed.length];
      const simulated = idx === numDays - 1 ? Math.max(seedVal, totalRevenueToday) : seedVal;
      return {
        day: dayLabel,
        revenue: Math.round(simulated),
      };
    });
  }, [revenueTimeRange, customStartDate, customEndDate, totalRevenueToday]);

  // Top-performing menu items by quantity sold over current week
  const topMenuItemsData = React.useMemo(() => {
    const itemMap = new Map<string, { id: string; name: string; category: string; price: number; quantitySold: number; totalRevenue: number }>();

    menuItems.forEach((m) => {
      itemMap.set(m.id, {
        id: m.id,
        name: m.name,
        category: m.category,
        price: m.price,
        quantitySold: 0,
        totalRevenue: 0,
      });
    });

    orders.forEach((ord) => {
      ord.items.forEach((item) => {
        const existing = itemMap.get(item.menuItemId);
        if (existing) {
          existing.quantitySold += item.quantity;
          existing.totalRevenue += item.quantity * item.unitPrice;
        } else {
          itemMap.set(item.menuItemId, {
            id: item.menuItemId,
            name: item.menuItemName,
            category: 'Mains',
            price: item.unitPrice,
            quantitySold: item.quantity,
            totalRevenue: item.quantity * item.unitPrice,
          });
        }
      });
    });

    const baselineAdditions: Record<string, number> = {
      'Wagyu Truffle Burger': 85,
      'Margherita Pizza': 72,
      'Classic Tiramisu': 54,
      'Craft Iced Latte': 68,
      'Truffle Parmesan Fries': 91,
      'Crispy Calamari': 46,
    };

    const result = Array.from(itemMap.values()).map((item) => {
      const extra = baselineAdditions[item.name] || 18;
      const totalQty = item.quantitySold + extra;
      return {
        ...item,
        quantitySold: totalQty,
        totalRevenue: item.totalRevenue + extra * item.price,
      };
    });

    return result.sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 6);
  }, [menuItems, orders]);

  // 7-day hourly order volume & revenue multi-series dataset
  const hourlyTrendsData = React.useMemo(() => {
    const hours = [
      '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM',
      '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM',
      '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM'
    ];

    const baseVolumes = [14, 38, 42, 22, 18, 25, 52, 68, 74, 58, 32, 16];
    const baseRevenues = [320, 940, 1120, 540, 420, 680, 1450, 1920, 2150, 1680, 890, 390];

    return hours.map((hr, idx) => {
      const liveBoost = orders.length;
      const vol = baseVolumes[idx] + (idx >= 6 && idx <= 9 ? Math.floor(liveBoost * 0.8) : Math.floor(liveBoost * 0.3));
      const rev = baseRevenues[idx] + (idx >= 6 && idx <= 9 ? Math.floor(totalRevenueToday * 0.12) : Math.floor(totalRevenueToday * 0.04));

      return {
        hour: hr,
        orderVolume: vol,
        revenue: rev,
        avgSpend: Math.round(rev / Math.max(vol, 1)),
      };
    });
  }, [orders.length, totalRevenueToday]);

  const COLORS = ['#2563eb', '#16a34a', '#9333ea', '#ea580c'];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Manager Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-gray-200 rounded-xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Manager Command Center</h1>
              <p className="text-xs text-gray-500">
                General Manager: <span className="text-blue-600 font-bold">{currentUser?.name || 'Alex Rivera'}</span> • Real-Time Operations Control
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              id="manager-top-pdf-btn"
              onClick={handleGeneratePdfReport}
              className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all border border-emerald-500/30"
              title="Download formatted daily executive PDF sales and performance report"
            >
              <FileText className="w-4 h-4" />
              Generate Daily Report (PDF)
            </button>

            <button
              id="manager-top-ai-audit-btn"
              onClick={() => {
                setActiveTab('ai');
                if (!aiInsights) handleRunAiAudit();
              }}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Gemini AI Operations Audit
            </button>
          </div>
        </div>

        {/* High-Level Key Performance Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 sm:p-5 rounded-xl bg-white border border-gray-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-semibold">Active Orders</span>
              <Layers className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{activeOrdersCount}</p>
            <p className="text-[10px] text-gray-400">Queued across floor & kitchen</p>
          </div>

          <div className="p-4 sm:p-5 rounded-xl bg-white border border-gray-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-semibold">Today's Revenue</span>
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-green-600">${totalRevenueToday}</p>
            <p className="text-[10px] text-gray-400">+18% vs yesterday average</p>
          </div>

          <div className="p-4 sm:p-5 rounded-xl bg-white border border-gray-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-semibold">Floor Occupancy</span>
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-purple-600">{occupancyPercentage}%</p>
            <p className="text-[10px] text-gray-400">{occupiedTablesCount} / {tables.length} Tables Occupied</p>
          </div>

          <div className="p-4 sm:p-5 rounded-xl bg-white border border-gray-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-semibold">Inventory Alerts</span>
              <Package className="w-4 h-4 text-red-600" />
            </div>
            <p className={`text-2xl sm:text-3xl font-bold ${lowStockCount > 0 ? 'text-red-600' : 'text-gray-800'}`}>
              {lowStockCount}
            </p>
            <p className="text-[10px] text-gray-400">{lowStockCount > 0 ? 'Items below threshold!' : 'Stock levels nominal'}</p>
          </div>
        </div>

        {/* Manager Navigation Sub-Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-gray-200 pb-2">
          {[
            { id: 'orders', label: 'Live Orders Feed', icon: Layers },
            { id: 'menu', label: 'Digital Menu Control', icon: UtensilsCrossed },
            { id: 'floorplan', label: 'Floor Plan Editor', icon: LayoutGrid },
            { id: 'inventory', label: 'Inventory Control', icon: Package },
            { id: 'staff', label: 'Agile Roles & Staff', icon: Users, badge: pendingUsers.length },
            { id: 'handover', label: 'Shift Handover', icon: MessageSquarePlus },
            { id: 'analytics', label: 'Sales Analytics', icon: BarChart3 },
            { id: 'ai', label: 'Platinum AI Hub', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                id={`manager-tab-${tab.id}`}
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id === 'ai' && !aiInsights) handleRunAiAudit();
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all relative ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {Boolean(tab.badge) && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: Live Orders Feed */}
        {activeTab === 'orders' && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
              <div>
                <h2 className="text-base font-bold text-gray-900">Live Restaurant Orders & Sales History</h2>
                <p className="text-xs text-gray-500">Monitor active orders and export historical sales data</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {['all', 'pending', 'preparing', 'ready', 'served'].map((st) => (
                    <button
                      id={`manager-filter-order-${st}`}
                      key={st}
                      onClick={() => setOrderFilter(st)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold uppercase ${
                        orderFilter === st ? 'bg-blue-600 text-white font-bold shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <button
                  id="manager-order-pdf-btn"
                  onClick={handleGeneratePdfReport}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors shrink-0"
                  title="Generate formatted daily executive PDF sales and performance report"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Generate Daily Report (PDF)
                </button>

                <button
                  id="manager-download-csv-btn"
                  onClick={handleDownloadCSV}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors shrink-0"
                  title="Export current order sales records to CSV file"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download CSV
                </button>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {orders
                .filter((o) => orderFilter === 'all' || o.status === orderFilter)
                .map((order) => (
                  <div key={order.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-600 text-sm">#{order.id}</span>
                        <span className="font-bold text-gray-900">Table #{order.tableNumber}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          order.status === 'ready' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-gray-500 mt-0.5">
                        Waiter: {order.waiterName} • {order.items.length} items • Guest: {order.customerName}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-gray-900">${order.totalAmount}</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 2: Digital Menu Management */}
        {activeTab === 'menu' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
              <div>
                <h2 className="text-base font-bold text-gray-900">Digital Menu & Live 86'd Item Control</h2>
                <p className="text-xs text-gray-500">Toggle dish availability and view live calculated portion servings based on current inventory stock.</p>
              </div>
              <button
                onClick={() => setShowAddMenuModal(true)}
                className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add New Dish
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.map((item) => {
                // Calculate max possible servings from inventory stock
                let recipe = item.recipeIngredients && item.recipeIngredients.length > 0 ? item.recipeIngredients : [];
                
                if (recipe.length === 0 && item.ingredients && item.ingredients.length > 0) {
                  recipe = (item.ingredients || []).map((ingName) => {
                    const match = (inventory || []).find((inv) =>
                      inv.ingredientName.toLowerCase().includes(ingName.toLowerCase()) ||
                      ingName.toLowerCase().includes(inv.ingredientName.toLowerCase())
                    );
                    return {
                      ingredientName: ingName,
                      qtyRequired: 1,
                      unit: match ? match.unit : 'portion'
                    };
                  });
                }

                const servingsList = (recipe || []).map((r) => {
                  const match = (inventory || []).find((inv) =>
                    inv.ingredientName.toLowerCase().includes(r.ingredientName.toLowerCase()) ||
                    r.ingredientName.toLowerCase().includes(inv.ingredientName.toLowerCase())
                  );
                  if (!match || r.qtyRequired <= 0) return 20;
                  return Math.floor(match.stockQty / r.qtyRequired);
                });

                const maxServings = servingsList.length > 0 ? Math.min(...servingsList) : 20;

                return (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <img
                          src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200'}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover shrink-0"
                        />
                        <div className="truncate">
                          <p className="text-xs font-bold text-gray-900 truncate">{item.name}</p>
                          <p className="text-[11px] text-gray-500">{item.category} • ${item.price}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleItem(item.id)}
                        className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors ${
                          item.isAvailable
                            ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-red-50 hover:text-red-700'
                            : 'bg-red-50 text-red-700 border border-red-200 hover:bg-green-50 hover:text-green-700'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        {item.isAvailable ? 'Available' : "86'd"}
                      </button>
                    </div>

                    {/* Ingredient Recipe & Calculated Stock Portion Servings */}
                    <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Required Ingredients</span>
                        <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                          maxServings < 5
                            ? 'bg-rose-100 text-rose-700 border border-rose-200 animate-pulse'
                            : maxServings < 15
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}>
                          {maxServings} Servings Available
                        </span>
                      </div>

                      <div className="text-[11px] text-gray-600 font-mono space-y-0.5">
                        {recipe.length > 0 ? (
                          recipe.map((r, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span className="truncate">{r.ingredientName}</span>
                              <span className="font-semibold text-gray-800">{r.qtyRequired} {r.unit} / portion</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-500 italic text-[10px]">{(item.ingredients || []).join(', ')}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: Interactive Floor Plan Editor */}
        {activeTab === 'floorplan' && (
          <FloorPlanEditor tables={tables} />
        )}

        {/* TAB 3: Inventory Control */}
        {activeTab === 'inventory' && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 space-y-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">Ingredient Stock Levels & Restock Control</h2>
                <p className="text-xs text-gray-500">Track key kitchen inventory and trigger 1-tap automated restocks.</p>
              </div>

              {/* 1-Click AI Restock Trigger */}
              {inventory.some((i) => i.stockQty <= i.lowStockThreshold) && (
                <button
                  onClick={async () => {
                    const lowItems = inventory.filter((i) => i.stockQty <= i.lowStockThreshold);
                    for (const item of lowItems) {
                      await handleRestock(item.id, item.stockQty);
                    }
                    alert(`AI Restock Draft Executed: Restocked ${lowItems.length} low-stock ingredients!`);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shrink-0"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>⚡ 1-Click AI Restock All Low Stock</span>
                </button>
              )}
            </div>

            {/* AI Restock Advisor Card */}
            {inventory.some((i) => i.stockQty <= i.lowStockThreshold) && (
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 font-extrabold text-xs text-amber-900 dark:text-amber-200">
                  <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
                  <span>Gemini AI Restock Advisor</span>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  {inventory.filter((i) => i.stockQty <= i.lowStockThreshold).length} ingredients are below threshold ({inventory.filter((i) => i.stockQty <= i.lowStockThreshold).map((i) => i.ingredientName).join(', ')}). Click the 1-Click AI Restock button above to issue automated supplier reorders.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inventory.map((inv) => {
                const isLow = inv.stockQty <= inv.lowStockThreshold;
                return (
                  <div
                    key={inv.id}
                    className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                      isLow ? 'bg-red-50 border-red-200 text-red-800' : 'bg-gray-50 border-gray-200 text-gray-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900">{inv.ingredientName}</span>
                        {isLow && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-red-600 text-white">
                            LOW STOCK
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Stock: <span className="font-mono font-bold text-blue-600">{inv.stockQty} {inv.unit}</span> (Threshold: {inv.lowStockThreshold} {inv.unit})
                      </p>
                    </div>

                    <button
                      onClick={() => handleRestock(inv.id, inv.stockQty)}
                      className="px-3.5 py-2 rounded-lg bg-gray-200 hover:bg-blue-600 hover:text-white text-gray-800 text-xs font-bold transition-colors shrink-0"
                    >
                      + Restock 10 {inv.unit}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: Agile User Roles & Staff Management */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            {/* Manager Agile Role Decision Panel */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 space-y-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-purple-100 text-purple-700 text-[10px] font-bold uppercase tracking-wider border border-purple-200">
                      Agile Role Control
                    </span>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-blue-600" />
                      Agile Staff & Job Role Management
                    </h2>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Anyone can sign up for KitchenSync staff access. As Manager, you determine job roles, assign floor tables, and control permissions.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddStaffModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Register / Invite Staff</span>
                </button>
              </div>

              {/* Toast Message */}
              {staffSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{staffSuccessMsg}</span>
                  </div>
                  <button onClick={() => setStaffSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Pending Approvals Callout Banner */}
              {pendingUsers.length > 0 && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 text-amber-900 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-800">
                      <AlertTriangle className="w-4 h-4 text-amber-600 animate-bounce" />
                      <span>{pendingUsers.length} New Sign-Up(s) Awaiting Manager Job Role Assignment</span>
                    </div>
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-200/60 px-2.5 py-0.5 rounded-full">
                      Action Needed
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                    {pendingUsers.map((pUser) => (
                      <div key={pUser.id} className="p-3 bg-white rounded-lg border border-amber-200 shadow-2xs space-y-2 text-xs">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={pUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'}
                            className="w-8 h-8 rounded-full object-cover ring-2 ring-amber-400/40"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-gray-900 truncate">{pUser.name}</p>
                            <p className="text-[10px] text-gray-500 truncate">{pUser.email}</p>
                          </div>
                        </div>

                        <div className="text-[11px] text-gray-600 font-medium bg-amber-50 p-2 rounded border border-amber-100 flex items-center justify-between">
                          <span>Requested Role:</span>
                          <span className="font-bold uppercase text-amber-800">{pUser.requestedRole || 'Waitstaff'}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-1 pt-1">
                          <button
                            onClick={() => handleQuickRoleChange(pUser.id, 'waiter')}
                            className="py-1 px-2 bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 text-blue-700 text-[10px] font-bold rounded text-center transition-colors"
                          >
                            Assign Waiter
                          </button>
                          <button
                            onClick={() => handleQuickRoleChange(pUser.id, 'kitchen')}
                            className="py-1 px-2 bg-purple-50 hover:bg-purple-600 hover:text-white border border-purple-200 text-purple-700 text-[10px] font-bold rounded text-center transition-colors"
                          >
                            Assign Kitchen
                          </button>
                          <button
                            onClick={() => handleQuickRoleChange(pUser.id, 'manager')}
                            className="py-1 px-2 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded text-center transition-colors"
                          >
                            Assign Manager
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Role Distribution Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-center space-y-1">
                  <p className="text-[10px] uppercase font-bold text-gray-500">Total Registered</p>
                  <p className="text-xl font-bold text-gray-900">{localUsers.length}</p>
                </div>
                <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl text-center space-y-1">
                  <p className="text-[10px] uppercase font-bold text-blue-700">Waitstaff</p>
                  <p className="text-xl font-bold text-blue-700">{localUsers.filter((u) => u.role === 'waiter').length}</p>
                </div>
                <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-xl text-center space-y-1">
                  <p className="text-[10px] uppercase font-bold text-purple-700">Kitchen Chefs</p>
                  <p className="text-xl font-bold text-purple-700">{localUsers.filter((u) => u.role === 'kitchen').length}</p>
                </div>
                <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-center space-y-1">
                  <p className="text-[10px] uppercase font-bold text-emerald-700">Managers</p>
                  <p className="text-xl font-bold text-emerald-700">{localUsers.filter((u) => u.role === 'manager').length}</p>
                </div>
                <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl text-center space-y-1 col-span-2 sm:col-span-1">
                  <p className="text-[10px] uppercase font-bold text-amber-700">Pending Roles</p>
                  <p className="text-xl font-bold text-amber-700">{pendingUsers.length}</p>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-gray-100">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={staffSearchQuery}
                    onChange={(e) => setStaffSearchQuery(e.target.value)}
                    placeholder="Search staff by name or email..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  <span className="text-xs text-gray-500 font-semibold mr-1 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" /> Filter:
                  </span>
                  {[
                    { id: 'all', label: 'All Staff' },
                    { id: 'pending', label: `Pending (${pendingUsers.length})` },
                    { id: 'waiter', label: 'Waitstaff' },
                    { id: 'kitchen', label: 'Kitchen' },
                    { id: 'manager', label: 'Managers' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setStaffFilterRole(f.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                        staffFilterRole === f.id
                          ? 'bg-gray-900 text-white shadow-xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Staff Roster & Interactive Role Selector Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsersList.map((st) => (
                  <div
                    key={st.id}
                    className={`p-4 rounded-xl border space-y-3 shadow-2xs transition-all relative ${
                      st.status === 'pending_approval' || st.role === 'unassigned'
                        ? 'bg-amber-50/30 border-amber-300'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* User Info Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={st.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'}
                          className="w-10 h-10 rounded-xl object-cover ring-1 ring-gray-200"
                        />
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-gray-900 truncate">{st.name}</h3>
                          <p className="text-xs text-gray-500 truncate">{st.email}</p>
                          {st.phone && <p className="text-[10px] text-gray-400 mt-0.5">{st.phone}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {onEditUserProfile && (
                          <button
                            onClick={() => onEditUserProfile(st)}
                            className="p-1.5 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                            title="Edit User Profile Details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteStaff(st.id, st.name)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Remove Staff Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Manager Role Assignement Selector */}
                    <div className="space-y-1.5 bg-gray-50 p-2.5 rounded-lg border border-gray-200/80">
                      <div className="flex items-center justify-between text-[11px] font-bold text-gray-700">
                        <span>Assigned Job Role:</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            st.role === 'manager'
                              ? 'bg-emerald-100 text-emerald-800'
                              : st.role === 'kitchen'
                              ? 'bg-purple-100 text-purple-800'
                              : st.role === 'waiter'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {st.role}
                        </span>
                      </div>

                      <select
                        value={st.role}
                        onChange={(e) => handleQuickRoleChange(st.id, e.target.value as UserRole)}
                        className="w-full px-2.5 py-1.5 rounded bg-white border border-gray-300 text-xs font-semibold text-gray-900 focus:outline-none focus:border-blue-600"
                      >
                        <option value="waiter">🍽️ Waitstaff (Floor & Tables)</option>
                        <option value="kitchen">🍳 Kitchen Chef (Display & Prep)</option>
                        <option value="manager">👑 Restaurant Manager (Full Control)</option>
                        <option value="unassigned">⏳ Unassigned / Pending Review</option>
                      </select>
                    </div>

                    {/* Pending Approval Quick Approve Button */}
                    {(st.status === 'pending_approval' || st.role === 'unassigned') && (
                      <button
                        onClick={() => handleApprovePendingStaff(st)}
                        className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve & Activate Staff Account</span>
                      </button>
                    )}

                    {/* Status & Table Assignments */}
                    <div className="flex items-center justify-between pt-1 text-xs gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-500 font-medium text-[11px]">Status:</span>
                        <select
                          value={st.status}
                          onChange={(e) => handleQuickStatusChange(st.id, e.target.value)}
                          className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-white border border-gray-200 text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="active">🟢 Active</option>
                          <option value="on-break">🟡 On Break</option>
                          <option value="off-duty">⚪ Off Duty</option>
                          <option value="pending_approval">🔴 Pending</option>
                        </select>
                      </div>

                      {st.role === 'waiter' && (
                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 block font-medium">Assigned Tables</span>
                          <button
                            onClick={() => handleUpdateWaiterTables(st.id, st.assignedTables)}
                            className="text-xs font-bold text-blue-700 hover:underline"
                            title="Click to edit assigned tables"
                          >
                            {st.assignedTables && st.assignedTables.length > 0 ? `Tables ${st.assignedTables.join(', ')}` : 'All Floor'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Existing Active Shifts Roster */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 space-y-4 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 border-b border-gray-200 pb-3">On-Duty Shift Schedule</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {shifts.map((sh) => (
                  <div key={sh.id} className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-gray-900 text-sm">{sh.userName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase bg-blue-100 text-blue-700 border border-blue-200">
                        {sh.role}
                      </span>
                    </div>
                    <p className="text-gray-600">Shift: {sh.shiftStart} - {sh.shiftEnd}</p>
                    <p className="text-gray-600">Assigned Tables: {sh.assignedTables.length > 0 ? sh.assignedTables.join(', ') : 'Kitchen Station'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Staff Scheduler Engine */}
            <AIStaffScheduler />

            {/* Modal: Add New Staff Member */}
            {showAddStaffModal && (
              <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-6 w-full max-w-md space-y-4 text-gray-900">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <h3 className="font-bold text-base flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-blue-600" />
                      Register New Staff Member
                    </h3>
                    <button onClick={() => setShowAddStaffModal(false)} className="text-gray-400 hover:text-gray-700">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateStaffSubmit} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={addStaffName}
                        onChange={(e) => setAddStaffName(e.target.value)}
                        placeholder="e.g. Samuel Vance"
                        className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={addStaffEmail}
                        onChange={(e) => setAddStaffEmail(e.target.value)}
                        placeholder="samuel@kitchensync.com"
                        className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Assigned Job Role</label>
                      <select
                        value={addStaffRole}
                        onChange={(e) => setAddStaffRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-blue-600 font-medium"
                      >
                        <option value="waiter">🍽️ Waitstaff (Floor & Tables)</option>
                        <option value="kitchen">🍳 Kitchen Chef (Display & Orders)</option>
                        <option value="manager">👑 Restaurant Manager</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={addStaffPhone}
                        onChange={(e) => setAddStaffPhone(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    {addStaffRole === 'waiter' && (
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Assigned Tables (Comma-separated)</label>
                        <input
                          type="text"
                          value={addStaffTables}
                          onChange={(e) => setAddStaffTables(e.target.value)}
                          placeholder="e.g. 1, 2, 3"
                          className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-blue-600"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setShowAddStaffModal(false)}
                        className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
                      >
                        Create Staff & Assign Role
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: Shift Handover & Operations Broadcast */}
        {activeTab === 'handover' && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <MessageSquarePlus className="w-5 h-5 text-blue-600" />
                    Manager Shift Handover & Broadcast Bulletin
                  </h2>
                  <p className="text-xs text-gray-500">
                    Broadcast critical instructions, prep notes, or shift logs for incoming managers and staff.
                  </p>
                </div>
                <span className="text-xs bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-full border border-blue-200 self-start sm:self-auto">
                  {shiftNotes.length} Broadcasted Notes
                </span>
              </div>

              {/* Compose New Handover Note */}
              <form onSubmit={handlePostHandoverNote} className="space-y-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
                <label className="block text-xs font-bold text-gray-800">
                  Broadcast New Instruction / Shift Handover Note
                </label>
                <textarea
                  required
                  value={handoverNoteText}
                  onChange={(e) => setHandoverNoteText(e.target.value)}
                  placeholder="e.g., Table 4 reserved at 7 PM for 10 guests. Salmon Fillets restocked. Ensure deep clean of espresso machine at closing..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-blue-600 shadow-sm"
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 font-medium">Priority Level:</span>
                    <select
                      value={handoverPriority}
                      onChange={(e) => setHandoverPriority(e.target.value as any)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-xs text-gray-800 focus:outline-none"
                    >
                      <option value="normal">Normal Priority</option>
                      <option value="urgent">Urgent / Critical Action</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" /> Broadcast Handover Note
                  </button>
                </div>
              </form>

              {/* Broadcasted Shift Notes Log */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-gray-500" />
                  Active Handover Log History
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {shiftNotes.map((note) => (
                    <div
                      key={note.id}
                      className={`p-4 rounded-xl border text-xs space-y-2 shadow-sm transition-all ${
                        note.priority === 'urgent'
                          ? 'bg-red-50/50 border-red-300 text-red-900'
                          : 'bg-white border-gray-200 text-gray-800 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold border-b border-gray-100 pb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-900">{note.authorName}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase bg-gray-100 text-gray-600 border border-gray-200">
                            {note.role}
                          </span>
                        </div>
                        {note.priority === 'urgent' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white animate-pulse">
                            URGENT
                          </span>
                        )}
                      </div>
                      <p className="leading-relaxed font-medium">{note.note}</p>
                      <div className="text-[10px] text-gray-400 text-right pt-1">
                        {new Date(note.timestamp).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Sales Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Top-Performing Menu Items Recharts Bar Chart */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <UtensilsCrossed className="w-5 h-5 text-blue-600" />
                    Top-Performing Menu Items by Quantity Sold (Current Week)
                  </h3>
                  <p className="text-xs text-gray-500">
                    Weekly sales volume and total revenue generated per top menu dish
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                  #1 Dish: {topMenuItemsData[0]?.name} ({topMenuItemsData[0]?.quantitySold} sold)
                </span>
              </div>

              <div className="h-80 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topMenuItemsData} margin={{ top: 10, right: 30, left: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      stroke="#4b5563"
                      fontSize={11}
                      tickLine={false}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis
                      stroke="#4b5563"
                      fontSize={11}
                      tickLine={false}
                      label={{ value: 'Units Sold', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#6b7280' }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white border border-gray-200 p-3 rounded-xl shadow-lg space-y-1 text-xs">
                              <p className="font-bold text-gray-900">{data.name}</p>
                              <p className="text-gray-500 font-medium">Category: {data.category}</p>
                              <div className="pt-1 border-t border-gray-100 flex items-center justify-between gap-4 font-mono">
                                <span className="text-blue-600 font-bold">Quantity Sold: {data.quantitySold} units</span>
                                <span className="text-emerald-600 font-bold">Revenue: ${data.totalRevenue.toLocaleString()}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="quantitySold" fill="#2563eb" radius={[6, 6, 0, 0]}>
                      {topMenuItemsData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={['#2563eb', '#1d4ed8', '#0284c7', '#0d9488', '#16a34a', '#9333ea'][index % 6]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top Items Summary Cards Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
                {topMenuItemsData.map((item, idx) => (
                  <div key={item.id} className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold font-mono text-[10px] flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{item.category}</span>
                    </div>
                    <p className="font-bold text-gray-900 truncate">{item.name}</p>
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-blue-600 font-bold">{item.quantitySold} sold</span>
                      <span className="text-emerald-600 font-bold">${item.totalRevenue}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Multi-Series Recharts Line Chart: Hourly Order Volume & Revenue Trends Over Last 7 Days */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    Hourly Order Volume & Revenue Trends (7-Day Multi-Series)
                  </h3>
                  <p className="text-xs text-gray-500">
                    Simultaneous multi-series tracking comparing peak hourly order volume (units) against gross sales ($)
                  </p>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                    Peak Hour: 07:00 PM (74 orders)
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                    Max Rev: $2,150
                  </span>
                </div>
              </div>

              <div className="h-80 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourlyTrendsData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="hour" stroke="#4b5563" fontSize={11} tickLine={false} />
                    <YAxis
                      yAxisId="revenue"
                      stroke="#16a34a"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => `$${val}`}
                      label={{ value: 'Revenue ($)', angle: -90, position: 'insideLeft', fill: '#16a34a', fontSize: 11, fontWeight: 'bold' }}
                    />
                    <YAxis
                      yAxisId="volume"
                      orientation="right"
                      stroke="#2563eb"
                      fontSize={11}
                      tickLine={false}
                      label={{ value: 'Order Volume (Units)', angle: 90, position: 'insideRight', fill: '#2563eb', fontSize: 11, fontWeight: 'bold' }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white border border-gray-200 p-3 rounded-xl shadow-lg space-y-1.5 text-xs font-sans">
                              <p className="font-bold text-gray-900 border-b border-gray-100 pb-1">{label} Operating Slot</p>
                              <div className="space-y-1 font-mono">
                                <p className="text-emerald-600 font-bold flex items-center justify-between gap-4">
                                  <span>Gross Revenue:</span>
                                  <span>${data.revenue.toLocaleString()}</span>
                                </p>
                                <p className="text-blue-600 font-bold flex items-center justify-between gap-4">
                                  <span>Order Volume:</span>
                                  <span>{data.orderVolume} orders</span>
                                </p>
                                <p className="text-gray-500 font-semibold flex items-center justify-between gap-4 text-[11px] pt-1 border-t border-gray-100">
                                  <span>Avg Spend / Order:</span>
                                  <span>${data.avgSpend}</span>
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                    <Line
                      yAxisId="revenue"
                      type="monotone"
                      dataKey="revenue"
                      name="Hourly Revenue ($)"
                      stroke="#16a34a"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#16a34a', stroke: '#ffffff', strokeWidth: 2 }}
                      activeDot={{ r: 8, fill: '#15803d' }}
                    />
                    <Line
                      yAxisId="volume"
                      type="monotone"
                      dataKey="orderVolume"
                      name="Hourly Order Volume (Orders)"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
                      activeDot={{ r: 8, fill: '#1d4ed8' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Daily Revenue Recharts Line Graph with Time Range Filter */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 space-y-4 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-200 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    Daily Revenue Sales Trend
                  </h3>
                  <p className="text-xs text-gray-500">Visualizing revenue performance over selected time period</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center bg-gray-100 p-1 rounded-lg text-xs font-bold border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setRevenueTimeRange('7days')}
                      className={`px-3 py-1 rounded-md transition-all ${
                        revenueTimeRange === '7days' ? 'bg-white text-blue-600 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Last 7 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setRevenueTimeRange('30days')}
                      className={`px-3 py-1 rounded-md transition-all ${
                        revenueTimeRange === '30days' ? 'bg-white text-blue-600 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Last 30 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setRevenueTimeRange('custom')}
                      className={`px-3 py-1 rounded-md transition-all ${
                        revenueTimeRange === 'custom' ? 'bg-white text-blue-600 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Custom Range
                    </button>
                  </div>

                  {revenueTimeRange === 'custom' && (
                    <div className="flex items-center gap-1.5 text-xs font-medium bg-blue-50 border border-blue-200 p-1 rounded-lg">
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="bg-white border border-gray-200 rounded px-2 py-0.5 text-xs font-mono"
                      />
                      <span className="text-gray-400">to</span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="bg-white border border-gray-200 rounded px-2 py-0.5 text-xs font-mono"
                      />
                    </div>
                  )}

                  <span className="text-xs font-mono font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                    Total: ${dailyRevenueData.reduce((acc, curr) => acc + curr.revenue, 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="h-72 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyRevenueData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" stroke="#6b7280" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#6b7280"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => `$${val}`}
                    />
                    <Tooltip
                      formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Daily Revenue']}
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderRadius: '8px', color: '#111827', fontWeight: 'bold' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#2563eb"
                      strokeWidth={3.5}
                      dot={{ r: 6, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
                      activeDot={{ r: 9, fill: '#1d4ed8' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 space-y-3 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900">Hourly Sales Revenue ($)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hourlyRevenueData}>
                      <XAxis dataKey="time" stroke="#6b7280" fontSize={11} />
                      <YAxis stroke="#6b7280" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderRadius: '8px', color: '#111827' }} />
                      <Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="#2563eb20" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 space-y-3 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900">Sales Breakdown by Category</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categorySalesData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {categorySalesData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderRadius: '8px', color: '#111827' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: Platinum Gemini AI Hub */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            {/* AI Staff Scheduler Section */}
            <AIStaffScheduler />

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gemini 3.6 Flash Intelligence Engine</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Platinum Intelligent Operations Report</h2>
                  <p className="text-xs text-gray-600">Smart staff scheduling suggestions, demand forecasting, inventory depletion risk, and bottleneck detection.</p>
                </div>

                <button
                  disabled={loadingAi}
                  onClick={handleRunAiAudit}
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingAi ? 'animate-spin' : ''}`} />
                  {loadingAi ? 'Analyzing Floor State...' : 'Re-run Gemini Audit'}
                </button>
              </div>

              {isAiFallback && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
                  Note: Using local AI operations heuristic model. Configure GEMINI_API_KEY in Secrets panel for live model queries.
                </div>
              )}
            </div>

            {aiInsights && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Operational Summary Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 space-y-2 md:col-span-2 shadow-sm">
                  <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> AI Operational Executive Summary
                  </h3>
                  <p className="text-sm text-gray-800 leading-relaxed font-sans">{aiInsights.operationalSummary}</p>
                </div>

                {/* Staff Scheduling Suggestions */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 space-y-3 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-600" /> Smart Staff Scheduling
                  </h3>
                  <div className="space-y-3">
                    {(aiInsights.schedulingSuggestions || []).map((s, idx) => (
                      <div key={idx} className="p-3.5 rounded-lg bg-gray-50 border border-gray-200 text-xs space-y-1">
                        <div className="flex justify-between font-bold text-green-700">
                          <span>{s.title}</span>
                          <span>{s.recommendedWaiters} Waiters Needed</span>
                        </div>
                        <p className="text-gray-700">{s.rationale}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inventory Risk Prediction */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 space-y-3 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-red-600" /> Inventory Depletion Risk
                  </h3>
                  <div className="space-y-3">
                    {(aiInsights.inventoryRisk || []).map((r, idx) => (
                      <div key={idx} className="p-3.5 rounded-lg bg-gray-50 border border-gray-200 text-xs space-y-1">
                        <div className="flex justify-between font-bold text-red-600">
                          <span>{r.ingredientName}</span>
                          <span>{r.riskLevel.toUpperCase()} RISK</span>
                        </div>
                        <p className="text-gray-700">{r.estimatedDepletion} (~{r.hoursLeft}h remaining)</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal: Add New Dish */}
        {showAddMenuModal && (
          <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-gray-900 dark:text-gray-100 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <UtensilsCrossed className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add New Menu Dish</h2>
                    <p className="text-xs text-gray-500">Live syncs across Waiter POS, KDS, & Customer QR ordering</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddMenuModal(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateMenuItem} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-1 font-bold">Dish Name *</label>
                  <input
                    type="text"
                    required
                    value={newDishName}
                    onChange={(e) => setNewDishName(e.target.value)}
                    placeholder="e.g. Pan-Seared Atlantic Salmon"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-medium focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-1 font-bold">Price ($) *</label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      required
                      value={newDishPrice}
                      onChange={(e) => setNewDishPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-mono font-bold focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-1 font-bold">Category</label>
                    <select
                      value={newDishCategory}
                      onChange={(e) => setNewDishCategory(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-medium focus:outline-none"
                    >
                      <option value="Appetizers">Appetizers</option>
                      <option value="Mains">Mains</option>
                      <option value="Desserts">Desserts</option>
                      <option value="Beverages">Beverages</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-1 font-bold">Prep Time (mins)</label>
                    <input
                      type="number"
                      min="1"
                      value={newDishPrepTime}
                      onChange={(e) => setNewDishPrepTime(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-medium focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-1 font-bold">Description</label>
                  <textarea
                    value={newDishDesc}
                    onChange={(e) => setNewDishDesc(e.target.value)}
                    rows={2}
                    placeholder="Freshly prepared with seasonal ingredients, herbs, and house reduction..."
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-medium focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-1 font-bold">Ingredients (comma separated)</label>
                  <input
                    type="text"
                    value={newDishIngredients}
                    onChange={(e) => setNewDishIngredients(e.target.value)}
                    placeholder="Salmon, Lemon, Garlic Butter, Asparagus"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-medium focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-1 font-bold">Image URL</label>
                  <input
                    type="url"
                    value={newDishImageUrl}
                    onChange={(e) => setNewDishImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white font-mono focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddMenuModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingDish}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm transition-all disabled:opacity-50"
                  >
                    {isSubmittingDish ? 'Adding Dish...' : '+ Add Dish to Live Menu'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Low Stock Automatic Toast Notification Overlay */}
      {lowStockItems.length > 0 && !dismissedToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md w-full bg-white border-2 border-red-500 rounded-xl shadow-2xl p-4 text-gray-900 space-y-3 animate-bounce-once">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0 animate-pulse" />
              <span>Manager Inventory Alert ({lowStockItems.length} {lowStockItems.length === 1 ? 'item' : 'items'} low)</span>
            </div>
            <button
              onClick={() => setDismissedToast(true)}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {lowStockItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-red-50 border border-red-200">
                <div>
                  <span className="font-bold text-gray-900">{item.ingredientName}</span>
                  <p className="text-[11px] text-red-700 font-mono">
                    Stock: {item.stockQty} {item.unit} (Threshold: {item.lowStockThreshold} {item.unit})
                  </p>
                </div>
                <button
                  onClick={() => handleRestock(item.id, item.stockQty)}
                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-sm shrink-0"
                >
                  <Plus className="w-3 h-3" /> Restock 10
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
