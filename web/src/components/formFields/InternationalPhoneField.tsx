import { InputAdornment, MenuItem, Select, TextField } from "@mui/material";

type CountryDialCode = {
  code: string;
  dialCode: string;
  dialCodes?: string[];
};

const countryDialCodes: CountryDialCode[] = [
  { code: "US", dialCode: "+1" },
  { code: "BS", dialCode: "+1242" },
  { code: "BB", dialCode: "+1246" },
  { code: "AI", dialCode: "+1264" },
  { code: "AG", dialCode: "+1268" },
  { code: "VG", dialCode: "+1284" },
  { code: "VI", dialCode: "+1340" },
  { code: "KY", dialCode: "+1345" },
  { code: "BM", dialCode: "+1441" },
  { code: "GD", dialCode: "+1473" },
  { code: "TC", dialCode: "+1649" },
  { code: "MS", dialCode: "+1664" },
  { code: "MP", dialCode: "+1670" },
  { code: "GU", dialCode: "+1671" },
  { code: "AS", dialCode: "+1684" },
  { code: "SX", dialCode: "+1721" },
  { code: "LC", dialCode: "+1758" },
  { code: "DM", dialCode: "+1767" },
  { code: "VC", dialCode: "+1784" },
  { code: "PR", dialCode: "+1787", dialCodes: ["+1939"] },
  { code: "DO", dialCode: "+1809", dialCodes: ["+1829", "+1849"] },
  { code: "TT", dialCode: "+1868" },
  { code: "KN", dialCode: "+1869" },
  { code: "JM", dialCode: "+1876" },
  { code: "EG", dialCode: "+20" },
  { code: "SS", dialCode: "+211" },
  { code: "MA", dialCode: "+212" },
  { code: "DZ", dialCode: "+213" },
  { code: "TN", dialCode: "+216" },
  { code: "LY", dialCode: "+218" },
  { code: "GM", dialCode: "+220" },
  { code: "SN", dialCode: "+221" },
  { code: "MR", dialCode: "+222" },
  { code: "ML", dialCode: "+223" },
  { code: "GN", dialCode: "+224" },
  { code: "CI", dialCode: "+225" },
  { code: "BF", dialCode: "+226" },
  { code: "NE", dialCode: "+227" },
  { code: "TG", dialCode: "+228" },
  { code: "BJ", dialCode: "+229" },
  { code: "MU", dialCode: "+230" },
  { code: "LR", dialCode: "+231" },
  { code: "SL", dialCode: "+232" },
  { code: "GH", dialCode: "+233" },
  { code: "NG", dialCode: "+234" },
  { code: "TD", dialCode: "+235" },
  { code: "CF", dialCode: "+236" },
  { code: "CM", dialCode: "+237" },
  { code: "CV", dialCode: "+238" },
  { code: "ST", dialCode: "+239" },
  { code: "GQ", dialCode: "+240" },
  { code: "GA", dialCode: "+241" },
  { code: "CG", dialCode: "+242" },
  { code: "CD", dialCode: "+243" },
  { code: "AO", dialCode: "+244" },
  { code: "GW", dialCode: "+245" },
  { code: "IO", dialCode: "+246" },
  { code: "SC", dialCode: "+248" },
  { code: "SD", dialCode: "+249" },
  { code: "RW", dialCode: "+250" },
  { code: "ET", dialCode: "+251" },
  { code: "SO", dialCode: "+252" },
  { code: "DJ", dialCode: "+253" },
  { code: "KE", dialCode: "+254" },
  { code: "TZ", dialCode: "+255" },
  { code: "UG", dialCode: "+256" },
  { code: "BI", dialCode: "+257" },
  { code: "MZ", dialCode: "+258" },
  { code: "ZM", dialCode: "+260" },
  { code: "MG", dialCode: "+261" },
  { code: "RE", dialCode: "+262" },
  { code: "ZW", dialCode: "+263" },
  { code: "NA", dialCode: "+264" },
  { code: "MW", dialCode: "+265" },
  { code: "LS", dialCode: "+266" },
  { code: "BW", dialCode: "+267" },
  { code: "SZ", dialCode: "+268" },
  { code: "KM", dialCode: "+269" },
  { code: "ZA", dialCode: "+27" },
  { code: "SH", dialCode: "+290" },
  { code: "ER", dialCode: "+291" },
  { code: "AW", dialCode: "+297" },
  { code: "FO", dialCode: "+298" },
  { code: "GL", dialCode: "+299" },
  { code: "GR", dialCode: "+30" },
  { code: "NL", dialCode: "+31" },
  { code: "BE", dialCode: "+32" },
  { code: "FR", dialCode: "+33" },
  { code: "ES", dialCode: "+34" },
  { code: "GI", dialCode: "+350" },
  { code: "PT", dialCode: "+351" },
  { code: "LU", dialCode: "+352" },
  { code: "IE", dialCode: "+353" },
  { code: "IS", dialCode: "+354" },
  { code: "AL", dialCode: "+355" },
  { code: "MT", dialCode: "+356" },
  { code: "CY", dialCode: "+357" },
  { code: "FI", dialCode: "+358" },
  { code: "AX", dialCode: "+35818" },
  { code: "BG", dialCode: "+359" },
  { code: "HU", dialCode: "+36" },
  { code: "LT", dialCode: "+370" },
  { code: "LV", dialCode: "+371" },
  { code: "EE", dialCode: "+372" },
  { code: "MD", dialCode: "+373" },
  { code: "AM", dialCode: "+374" },
  { code: "BY", dialCode: "+375" },
  { code: "AD", dialCode: "+376" },
  { code: "MC", dialCode: "+377" },
  { code: "SM", dialCode: "+378" },
  { code: "VA", dialCode: "+379" },
  { code: "UA", dialCode: "+380" },
  { code: "RS", dialCode: "+381" },
  { code: "ME", dialCode: "+382" },
  { code: "XK", dialCode: "+383" },
  { code: "HR", dialCode: "+385" },
  { code: "SI", dialCode: "+386" },
  { code: "BA", dialCode: "+387" },
  { code: "MK", dialCode: "+389" },
  { code: "IT", dialCode: "+39" },
  { code: "RO", dialCode: "+40" },
  { code: "CH", dialCode: "+41" },
  { code: "CZ", dialCode: "+420" },
  { code: "SK", dialCode: "+421" },
  { code: "LI", dialCode: "+423" },
  { code: "AT", dialCode: "+43" },
  { code: "GB", dialCode: "+44" },
  { code: "GG", dialCode: "+441481" },
  { code: "JE", dialCode: "+441534" },
  { code: "IM", dialCode: "+441624" },
  { code: "DK", dialCode: "+45" },
  { code: "SE", dialCode: "+46" },
  { code: "NO", dialCode: "+47" },
  { code: "PL", dialCode: "+48" },
  { code: "DE", dialCode: "+49" },
  { code: "FK", dialCode: "+500" },
  { code: "BZ", dialCode: "+501" },
  { code: "GT", dialCode: "+502" },
  { code: "SV", dialCode: "+503" },
  { code: "HN", dialCode: "+504" },
  { code: "NI", dialCode: "+505" },
  { code: "CR", dialCode: "+506" },
  { code: "PA", dialCode: "+507" },
  { code: "PM", dialCode: "+508" },
  { code: "HT", dialCode: "+509" },
  { code: "PE", dialCode: "+51" },
  { code: "MX", dialCode: "+52" },
  { code: "CU", dialCode: "+53" },
  { code: "AR", dialCode: "+54" },
  { code: "BR", dialCode: "+55" },
  { code: "CL", dialCode: "+56" },
  { code: "CO", dialCode: "+57" },
  { code: "VE", dialCode: "+58" },
  { code: "GP", dialCode: "+590" },
  { code: "BO", dialCode: "+591" },
  { code: "GY", dialCode: "+592" },
  { code: "EC", dialCode: "+593" },
  { code: "GF", dialCode: "+594" },
  { code: "PY", dialCode: "+595" },
  { code: "MQ", dialCode: "+596" },
  { code: "SR", dialCode: "+597" },
  { code: "UY", dialCode: "+598" },
  { code: "CW", dialCode: "+599" },
  { code: "MY", dialCode: "+60" },
  { code: "AU", dialCode: "+61" },
  { code: "ID", dialCode: "+62" },
  { code: "PH", dialCode: "+63" },
  { code: "NZ", dialCode: "+64" },
  { code: "SG", dialCode: "+65" },
  { code: "TH", dialCode: "+66" },
  { code: "TL", dialCode: "+670" },
  { code: "NF", dialCode: "+672" },
  { code: "BN", dialCode: "+673" },
  { code: "NR", dialCode: "+674" },
  { code: "PG", dialCode: "+675" },
  { code: "TO", dialCode: "+676" },
  { code: "SB", dialCode: "+677" },
  { code: "VU", dialCode: "+678" },
  { code: "FJ", dialCode: "+679" },
  { code: "PW", dialCode: "+680" },
  { code: "WF", dialCode: "+681" },
  { code: "CK", dialCode: "+682" },
  { code: "NU", dialCode: "+683" },
  { code: "WS", dialCode: "+685" },
  { code: "KI", dialCode: "+686" },
  { code: "NC", dialCode: "+687" },
  { code: "TV", dialCode: "+688" },
  { code: "PF", dialCode: "+689" },
  { code: "TK", dialCode: "+690" },
  { code: "FM", dialCode: "+691" },
  { code: "MH", dialCode: "+692" },
  { code: "RU", dialCode: "+7" },
  { code: "JP", dialCode: "+81" },
  { code: "KR", dialCode: "+82" },
  { code: "VN", dialCode: "+84" },
  { code: "KP", dialCode: "+850" },
  { code: "HK", dialCode: "+852" },
  { code: "MO", dialCode: "+853" },
  { code: "KH", dialCode: "+855" },
  { code: "LA", dialCode: "+856" },
  { code: "CN", dialCode: "+86" },
  { code: "BD", dialCode: "+880" },
  { code: "TW", dialCode: "+886" },
  { code: "TR", dialCode: "+90" },
  { code: "IN", dialCode: "+91" },
  { code: "PK", dialCode: "+92" },
  { code: "AF", dialCode: "+93" },
  { code: "LK", dialCode: "+94" },
  { code: "MM", dialCode: "+95" },
  { code: "MV", dialCode: "+960" },
  { code: "LB", dialCode: "+961" },
  { code: "JO", dialCode: "+962" },
  { code: "SY", dialCode: "+963" },
  { code: "IQ", dialCode: "+964" },
  { code: "KW", dialCode: "+965" },
  { code: "SA", dialCode: "+966" },
  { code: "YE", dialCode: "+967" },
  { code: "OM", dialCode: "+968" },
  { code: "PS", dialCode: "+970" },
  { code: "AE", dialCode: "+971" },
  { code: "IL", dialCode: "+972" },
  { code: "BH", dialCode: "+973" },
  { code: "QA", dialCode: "+974" },
  { code: "BT", dialCode: "+975" },
  { code: "MN", dialCode: "+976" },
  { code: "NP", dialCode: "+977" },
  { code: "IR", dialCode: "+98" },
  { code: "TJ", dialCode: "+992" },
  { code: "TM", dialCode: "+993" },
  { code: "AZ", dialCode: "+994" },
  { code: "GE", dialCode: "+995" },
  { code: "KG", dialCode: "+996" },
  { code: "UZ", dialCode: "+998" },
];

const getFlagEmoji = (code: string) =>
  code
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt(0))
    );

const displayNames =
  typeof Intl !== "undefined" &&
  "DisplayNames" in Intl &&
  typeof (Intl as any).DisplayNames === "function"
    ? new (Intl as any).DisplayNames(["en"], { type: "region" })
    : null;

const getCountryLabel = (code: string) =>
  displayNames?.of(code) || code;

const phoneCountryOptions = countryDialCodes.map((country) => ({
  ...country,
  label: getCountryLabel(country.code),
  flag: getFlagEmoji(country.code),
}));

const defaultCountryOption =
  phoneCountryOptions.find((option) => option.code === "ZA") ??
  phoneCountryOptions[0];

const dialCodeEntries = countryDialCodes
  .flatMap((country) =>
    [country.dialCode, ...(country.dialCodes ?? [])].map((dialCode) => ({
      code: country.code,
      dialCode,
    }))
  )
  .sort((a, b) => b.dialCode.length - a.dialCode.length);

// eslint-disable-next-line react-refresh/only-export-components
export function getDefaultPhoneCountry(localeCountry?: string) {
  if (
    localeCountry &&
    phoneCountryOptions.some((option) => option.code === localeCountry)
  ) {
    return localeCountry;
  }
  return "ZA";
}

// eslint-disable-next-line react-refresh/only-export-components
export function splitInternationalPhone(value?: string) {
  if (!value) {
    return { country: "ZA", local: "" };
  }
  const trimmed = value.trim();
  if (!trimmed.startsWith("+")) {
    return { country: "ZA", local: trimmed };
  }
  const match = dialCodeEntries.find((option) =>
    trimmed.startsWith(option.dialCode)
  );
  if (!match) {
    return { country: "ZA", local: trimmed.replace(/^\+/, "") };
  }
  return {
    country: match.code,
    local: trimmed.slice(match.dialCode.length).trim(),
  };
}

// eslint-disable-next-line react-refresh/only-export-components
export function buildInternationalPhone(countryCode: string, local: string) {
  const option =
    phoneCountryOptions.find((item) => item.code === countryCode) ||
    defaultCountryOption;
  const trimmedLocal = local.trim();
  return trimmedLocal ? `${option.dialCode}${trimmedLocal}` : "";
}

type InternationalPhoneFieldProps = {
  label?: string;
  required?: boolean;
  placeholder?: string;
  country: string;
  local: string;
  onCountryChange: (value: string) => void;
  onLocalChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
};

export function InternationalPhoneField({
  label = "Phone",
  required,
  placeholder = "Mobile phone number",
  country,
  local,
  onCountryChange,
  onLocalChange,
  onBlur,
  disabled = false,
}: InternationalPhoneFieldProps) {
  return (
    <TextField
      label={label}
      required={required}
      placeholder={placeholder}
      value={local}
      onChange={(e) => onLocalChange(e.target.value)}
      onBlur={onBlur}
      disabled={disabled}
      fullWidth
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Select
              value={country}
              onChange={(e) => onCountryChange(e.target.value as string)}
              variant="standard"
              disableUnderline
              inputProps={{
                "aria-label": "Country selector",
                "data-testid": "country-select",
              }}
              sx={{ minWidth: 86 }}
              disabled={disabled}
            >
              {phoneCountryOptions.map((option) => (
                <MenuItem key={`${option.code}-${option.dialCode}`} value={option.code}>
                  {option.flag} {option.dialCode}
                </MenuItem>
              ))}
            </Select>
          </InputAdornment>
        ),
      }}
    />
  );
}
