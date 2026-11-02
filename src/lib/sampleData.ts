import { Student, ClassItem, Subject } from '@/types';

// Realistic 70-student engineering roster for realistic testing and demonstration
export const SAMPLE_STUDENTS_70 = [
  { usn: "1MS23CS001", fullName: "Aarav Sharma" },
  { usn: "1MS23CS002", fullName: "Aanya Patel" },
  { usn: "1MS23CS003", fullName: "Aditya Verma" },
  { usn: "1MS23CS004", fullName: "Akanksha Reddy" },
  { usn: "1MS23CS005", fullName: "Alok Mukherjee" },
  { usn: "1MS23CS006", fullName: "Ananya Iyer" },
  { usn: "1MS23CS007", fullName: "Aniket Joshi" },
  { usn: "1MS23CS008", fullName: "Anjali Gupta" },
  { usn: "1MS23CS009", fullName: "Anshul Saxena" },
  { usn: "1MS23CS010", fullName: "Arjun Nair" },
  { usn: "1MS23CS011", fullName: "Arman Khan" },
  { usn: "1MS23CS012", fullName: "Ashwin Rao" },
  { usn: "1MS23CS013", fullName: "Avani Deshmukh" },
  { usn: "1MS23CS014", fullName: "Ayush Tiwari" },
  { usn: "1MS23CS015", fullName: "Bhavya Hegde" },
  { usn: "1MS23CS016", fullName: "Chetan Kulkarni" },
  { usn: "1MS23CS017", fullName: "Deepak Choudhary" },
  { usn: "1MS23CS018", fullName: "Devika Nambiar" },
  { usn: "1MS23CS019", fullName: "Dhruv Bhatt" },
  { usn: "1MS23CS020", fullName: "Diya Roy" },
  { usn: "1MS23CS021", fullName: "Gaurav Malhotra" },
  { usn: "1MS23CS022", fullName: "Harini Sundaram" },
  { usn: "1MS23CS023", fullName: "Harshil Shah" },
  { usn: "1MS23CS024", fullName: "Isha Kapoor" },
  { usn: "1MS23CS025", fullName: "Ishaan Mehra" },
  { usn: "1MS23CS026", fullName: "Janhavi Pillai" },
  { usn: "1MS23CS027", fullName: "Karan Singhal" },
  { usn: "1MS23CS028", fullName: "Kavya Menon" },
  { usn: "1MS23CS029", fullName: "Kunal Bansal" },
  { usn: "1MS23CS030", fullName: "Madhav Dixit" },
  { usn: "1MS23CS031", fullName: "Manish Agarwal" },
  { usn: "1MS23CS032", fullName: "Meera Bhatnagar" },
  { usn: "1MS23CS033", fullName: "Mohit Chauhan" },
  { usn: "1MS23CS034", fullName: "Nandini Sen" },
  { usn: "1MS23CS035", fullName: "Navin Pillai" },
  { usn: "1MS23CS036", fullName: "Neha Srinivasan" },
  { usn: "1MS23CS037", fullName: "Nikhil Pandey" },
  { usn: "1MS23CS038", fullName: "Nirav Patel" },
  { usn: "1MS23CS039", fullName: "Pooja Hegde" },
  { usn: "1MS23CS040", fullName: "Pranav Varma" },
  { usn: "1MS23CS041", fullName: "Prashant Kumar" },
  { usn: "1MS23CS042", fullName: "Priya Das" },
  { usn: "1MS23CS043", fullName: "Rahul Nambiar" },
  { usn: "1MS23CS044", fullName: "Rhea Chawla" },
  { usn: "1MS23CS045", fullName: "Rishi Kaushik" },
  { usn: "1MS23CS046", fullName: "Rohan Deshpande" },
  { usn: "1MS23CS047", fullName: "Rohit Shetty" },
  { usn: "1MS23CS048", fullName: "Sakshi Jain" },
  { usn: "1MS23CS049", fullName: "Samarth Gowda" },
  { usn: "1MS23CS050", fullName: "Sameer Kazi" },
  { usn: "1MS23CS051", fullName: "Sanjana Venkatesh" },
  { usn: "1MS23CS052", fullName: "Sarthak Ghosh" },
  { usn: "1MS23CS053", fullName: "Shreya Shenoy" },
  { usn: "1MS23CS054", fullName: "Siddharth Sethi" },
  { usn: "1MS23CS055", fullName: "Simran Kaur" },
  { usn: "1MS23CS056", fullName: "Sneha Murthy" },
  { usn: "1MS23CS057", fullName: "Sourav Ganguly" },
  { usn: "1MS23CS058", fullName: "Sparsh Mittal" },
  { usn: "1MS23CS059", fullName: "Tanvi Rangan" },
  { usn: "1MS23CS060", fullName: "Tarun Reddy" },
  { usn: "1MS23CS061", fullName: "Trisha Mukherjee" },
  { usn: "1MS23CS062", fullName: "Utkarsh Srivastava" },
  { usn: "1MS23CS063", fullName: "Varun Nair" },
  { usn: "1MS23CS064", fullName: "Vedant Salunke" },
  { usn: "1MS23CS065", fullName: "Vibha Balasubramanian" },
  { usn: "1MS23CS066", fullName: "Vikramaditya Bose" },
  { usn: "1MS23CS067", fullName: "Vinay Prasad" },
  { usn: "1MS23CS068", fullName: "Yashaswi Patil" },
  { usn: "1MS23CS069", fullName: "Yuvraj Singh" },
  { usn: "1MS23CS070", fullName: "Zoya Farooqui" },
];

export function generateSampleRosterCSV(): string {
  const header = "USN,Student Name,Section\n";
  const rows = SAMPLE_STUDENTS_70.map(s => `"${s.usn}","${s.fullName}","A"`).join("\n");
  return header + rows;
}

export function downloadSampleCSV(filename = "classpulse_sample_roster.csv") {
  const content = "\uFEFF" + generateSampleRosterCSV();
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
