import { parseISO, format, isValid } from "date-fns";

interface DateProps {
  dateString: string;
}

export default function Date({ dateString }: DateProps) {
  if (!dateString) {
    return <time>Invalid Date</time>;
  }
  
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) {
      return <time>Invalid Date</time>;
    }
    return <time dateTime={dateString}>{format(date, "LLLL d, yyyy")}</time>;
  } catch (error) {
    console.error("Date parsing error:", error);
    return <time>Invalid Date</time>;
  }
}

