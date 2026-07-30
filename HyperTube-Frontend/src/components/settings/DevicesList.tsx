import { Trash2, Smartphone, Monitor, Globe } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "react-i18next";
import useConfirmationPopupHandler from "@/hooks/UseConfirmationPopup";

type Props = {
  devices: any[];
  onRevoke: (id: string) => void;
  revokingId?: string | null;
  onRevokeOthers?: () => void;
};

export default function DevicesList({
  devices,
  onRevoke,
  revokingId,
  onRevokeOthers,
}: Props) {
  const { t } = useTranslation();
  const { handleOpenConfirmation } = useConfirmationPopupHandler();

  if (!devices?.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-white/70">{t("SettingsPage.noDevices")}</p>
      </div>
    );
  }

  const renderIcon = (ua?: string) => {
    const s = (ua || "").toLowerCase();
    if (s.includes("mobile") || s.includes("android") || s.includes("iphone"))
      return <Smartphone className="w-5 h-5" />;
    return <Monitor className="w-5 h-5" />;
  };

  return (
    <div className="space-y-3">
      {devices.map((d) => (
        <div
          key={d.id}
          className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3"
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg bg-gradient-to-br from-primary-100/40 to-primary-100/10 text-black/90 flex items-center justify-center ${d.isCurrentDevice ? "ring-2 ring-primary-100/60" : ""}`}
            >
              {renderIcon(d.userAgent)}
            </div>
            <div>
              <div className="text-white/90 text-sm font-medium">
                {d.deviceName ||
                  d.userAgent?.slice(0, 40) ||
                  t("SettingsPage.unkownDevice")}
                {d.isCurrentDevice && (
                  <span className="ml-2 text-xs text-primary-100">
                    {t("SettingsPage.current")}
                  </span>
                )}
              </div>
              <div className="text-xs text-white/50 flex items-center gap-2">
                {d.location && (
                  <span className="inline-flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {d.location}
                  </span>
                )}
                {d.ipAddress && <span>• {d.ipAddress.split("-")[0]}</span>}
                {d.lastUsedAt && (
                  <span>
                    • {t("SettingsPage.lastActive")}{" "}
                    {new Date(d.lastUsedAt).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
          {!d.isCurrentDevice && (
            <Button
              isIcon={false}
              className="w-fit"
              size="sm"
              variant="Secondary"
              label={
                revokingId === d.id
                  ? t("SettingsPage.removing")
                  : t("SettingsPage.remove")
              }
              disabled={!!revokingId}
              onClick={() =>
                handleOpenConfirmation({
                  title: t("SettingsPage.confirmRevokeTitle"),
                  message: t("SettingsPage.confirmRevokeMessage", {
                    device:
                      d.deviceName ||
                      d.userAgent?.slice(0, 40) ||
                      t("SettingsPage.unkownDevice"),
                  }),
                  onConfirm: () => {
                    onRevoke(d.id);
                  },
                })
              }
              icon={Trash2}
            />
          )}
        </div>
      ))}

      {onRevokeOthers && devices.some((d) => !d.isCurrentDevice) && (
        <div className="pt-2">
          <Button
            size="sm"
            variant="Secondary"
            label={t("SettingsPage.removeAllDevices")}
            isIcon={false}
            onClick={() =>
              handleOpenConfirmation({
                title: t("SettingsPage.confirmRevokeAllTitle"),
                message: t("SettingsPage.confirmRevokeAllMessage"),
                onConfirm: () => {
                  onRevokeOthers();
                },
              })
            }
            icon={Trash2}
          />
        </div>
      )}
    </div>
  );
}
