package com.ProblemSolvings.Problem.Solving.Peoblemnew;

public class IpAddProblem {
        public static void main(String[] args) {
            // Test the function with a sample input
            String ipv6addr = "::FFFF:C0A8:0A5C";
            convertipv6ToIpv4(ipv6addr);
        }

        public static void convertipv6ToIpv4(String ipv6addr) {
            // Check if the input starts with "::FFFF:"
            if (!ipv6addr.startsWith("::FFFF:")) {
                System.out.println("Invalid IPv6 address for conversion.");
                return;
            }

            // Remove the "::FFFF:" prefix to get the rest of the address
            String hexPart = ipv6addr.substring(7);  // Remove "::FFFF:"

            // Split the remaining part by ":"
            String[] hexGroups = hexPart.split(":");

            // We need exactly two groups of 4 hexadecimal digits
            if (hexGroups.length != 2) {
                System.out.println("Invalid IPv6 address format.");
                return;
            }

            // Convert the two groups into individual hexadecimal values
            String hex1 = hexGroups[0]; // First group
            String hex2 = hexGroups[1]; // Second group

            // Extract two 2-character segments from each group
            String[] hex1Parts = {hex1.substring(0, 2), hex1.substring(2, 4)};
            String[] hex2Parts = {hex2.substring(0, 2), hex2.substring(2, 4)};

            // Convert hex parts to decimal and build the IPv4 address
            StringBuilder ipv4Addr = new StringBuilder();

            // Convert each hexadecimal pair to decimal and append to the IPv4 address
            for (int i = 0; i < 2; i++) {
                int part1 = Integer.parseInt(hex1Parts[i], 16);
                int part2 = Integer.parseInt(hex2Parts[i], 16);

                // Append to the IPv4 address with a period as delimiter
                if (i > 0) ipv4Addr.append(".");
                ipv4Addr.append(part1).append(".").append(part2);
            }

            StringBuilder ipv45Addr = new StringBuilder();

//// Convert each hex segment into decimal and build IPv4 address
//            ipv4Addr.append(Integer.parseInt(hex1Parts[0], 16)).append(".")
//                    .append(Integer.parseInt(hex1Parts[1], 16)).append(".")
//                    .append(Integer.parseInt(hex2Parts[0], 16)).append(".")
//                    .append(Integer.parseInt(hex2Parts[1], 16));
//
//            System.out.println(ipv4Addr.toString());


            // Print the resulting IPv4 address
            System.out.println(ipv4Addr.toString());
        }


}
