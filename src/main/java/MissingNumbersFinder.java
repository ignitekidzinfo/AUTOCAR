import java.util.ArrayList;
import java.util.List;

public class MissingNumbersFinder {
    public static void main(String[] args) {
        int[] arr = {1, 2, 3, 5, 7, 9};
        List<Integer> missingNumbers = findMissingNumbers(arr);

        System.out.println("Missing numbers: " + missingNumbers);
    }
    public static List<Integer> findMissingNumbers(int[] arr) {
        List<Integer> missingNumbers = new ArrayList<>();
        int start = arr[0];
        int end = arr[arr.length - 1];

        int index = 0;
        for (int num = start; num <= end; num++) {
            if (index < arr.length && arr[index] == num) {
                index++;
            } else {
                missingNumbers.add(num);
            }
        }
        return missingNumbers;
    }
}
