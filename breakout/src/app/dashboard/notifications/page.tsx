import { Bell, CheckCircle, Info, AlertTriangle } from "lucide-react";

export default function UserNotificationsPage() {
  const notifications = [
    {
      id: 1,
      title: "Album Approved!",
      message: "Your album 'Midnight Vibes' has been approved and sent to stores.",
      date: "2 hours ago",
      type: "success",
      icon: CheckCircle,
      color: "text-green-400",
      bg: "bg-green-400/10",
    },
    {
      id: 2,
      title: "Royalty Payment Processed",
      message: "Your withdrawal request for Rp 150.000 has been completed successfully.",
      date: "1 day ago",
      type: "success",
      icon: CheckCircle,
      color: "text-green-400",
      bg: "bg-green-400/10",
    },
    {
      id: 3,
      title: "New Platform Feature",
      message: "Check out our new advanced Analytics dashboard!",
      date: "3 days ago",
      type: "info",
      icon: Info,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      id: 4,
      title: "Action Required: Tax Info",
      message: "Please update your tax information to avoid payment delays.",
      date: "5 days ago",
      type: "warning",
      icon: AlertTriangle,
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
    }
  ];

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Notifications</h1>
        <p className="text-gray-400">Stay updated with your releases, royalties, and platform news.</p>
      </div>

      <div className="glass-card p-2">
        {notifications.map((notif, index) => {
          const Icon = notif.icon;
          return (
            <div 
              key={notif.id}
              className={`p-6 flex items-start gap-4 transition hover:bg-white/5 ${
                index !== notifications.length - 1 ? "border-b border-white/10" : ""
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.bg} ${notif.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-lg text-white">{notif.title}</h3>
                  <span className="text-xs text-gray-500 font-medium">{notif.date}</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{notif.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
