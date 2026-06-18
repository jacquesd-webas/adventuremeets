import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { Organization } from "../types/OrganizationModel";

export function useFetchOrganization(orgId?: string) {
  const api = useApi();

  const mapOrganization = (org: any): Organization => ({
    id: org.id,
    name: org.name,
    logoUrl: org.logoUrl ?? org.logo_url ?? undefined,
    isPrivate: org.isPrivate ?? org.is_private ?? undefined,
    theme: org.theme ?? undefined,
    canViewAllMeets: org.canViewAllMeets ?? org.can_view_all_meets ?? undefined,
    customField1Name:
      org.customField1Name ?? org.custom_field1_name ?? undefined,
    customField2Name:
      org.customField2Name ?? org.custom_field2_name ?? undefined,
    customField1HelperText:
      org.customField1HelperText ??
      org.custom_field1_helper_text ??
      undefined,
    customField2HelperText:
      org.customField2HelperText ??
      org.custom_field2_helper_text ??
      undefined,
    meetCountLast30Days:
      typeof org.meetCountLast30Days === "number"
        ? org.meetCountLast30Days
        : org.meet_count_last_30_days != null
          ? Number(org.meet_count_last_30_days)
          : undefined,
    attendanceCountLast30Days:
      typeof org.attendanceCountLast30Days === "number"
        ? org.attendanceCountLast30Days
        : org.attendance_count_last_30_days != null
          ? Number(org.attendance_count_last_30_days)
          : undefined,
    meetCountLast90Days:
      typeof org.meetCountLast90Days === "number"
        ? org.meetCountLast90Days
        : org.meet_count_last_90_days != null
          ? Number(org.meet_count_last_90_days)
          : undefined,
    attendanceCountLast90Days:
      typeof org.attendanceCountLast90Days === "number"
        ? org.attendanceCountLast90Days
        : org.attendance_count_last_90_days != null
          ? Number(org.attendance_count_last_90_days)
          : undefined,
    meetCountTotal:
      typeof org.meetCountTotal === "number"
        ? org.meetCountTotal
        : org.meet_count_total != null
          ? Number(org.meet_count_total)
          : undefined,
    attendanceCountTotal:
      typeof org.attendanceCountTotal === "number"
        ? org.attendanceCountTotal
        : org.attendance_count_total != null
          ? Number(org.attendance_count_total)
          : undefined,
    adminCount:
      typeof org.adminCount === "number"
        ? org.adminCount
        : org.admin_count != null
          ? Number(org.admin_count)
          : undefined,
    organizerCount:
      typeof org.organizerCount === "number"
        ? org.organizerCount
        : org.organizer_count != null
          ? Number(org.organizer_count)
          : undefined,
    memberCount:
      typeof org.memberCount === "number"
        ? org.memberCount
        : org.member_count != null
          ? Number(org.member_count)
          : undefined,
    meetImageBytes:
      typeof org.meetImageBytes === "number"
        ? org.meetImageBytes
        : org.meet_image_bytes != null
          ? Number(org.meet_image_bytes)
          : undefined,
    wallImageBytes:
      typeof org.wallImageBytes === "number"
        ? org.wallImageBytes
        : org.wall_image_bytes != null
          ? Number(org.wall_image_bytes)
          : undefined,
    totalImageBytes:
      typeof org.totalImageBytes === "number"
        ? org.totalImageBytes
        : org.total_image_bytes != null
          ? Number(org.total_image_bytes)
          : undefined,
    reportingEnabled:
      org.reportingEnabled ?? org.reporting_enabled ?? undefined,
    brandingEnabled: org.brandingEnabled ?? org.branding_enabled ?? undefined,
    domainEnabled: org.domainEnabled ?? org.domain_enabled ?? undefined,
    whatsappEnabled:
      org.whatsappEnabled ?? org.whatsapp_enabled ?? undefined,
    paymentsEnabled:
      org.paymentsEnabled ?? org.payments_enabled ?? undefined,
    diskQuotasEnabled:
      org.diskQuotasEnabled ?? org.disk_quotas_enabled ?? undefined,
    userCount:
      typeof org.userCount === "number"
        ? org.userCount
        : org.user_count != null
          ? Number(org.user_count)
          : undefined,
    templateCount:
      typeof org.templateCount === "number"
        ? org.templateCount
        : org.template_count != null
          ? Number(org.template_count)
          : undefined,
    createdAt: org.createdAt ?? org.created_at,
    updatedAt: org.updatedAt ?? org.updated_at,
  });

  const query = useQuery({
    queryKey: ["organization", orgId],
    enabled: Boolean(orgId),
    queryFn: async () => {
      const res = await api.get<{ organization: Organization }>(
        `/organizations/${orgId}`,
      );
      return res?.organization ? mapOrganization(res.organization) : null;
    },
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
  };
}
