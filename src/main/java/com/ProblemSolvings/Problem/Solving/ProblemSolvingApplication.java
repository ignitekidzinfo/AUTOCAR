package com.ProblemSolvings.Problem.Solving;

import com.ProblemSolvings.Problem.Solving.Problems.PalindromeString;
import com.ProblemSolvings.Problem.Solving.Problems.RemoveDuplicate;
import com.ProblemSolvings.Problem.Solving.Problems.ReverseThrWordsInString;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.ArrayList;
import java.util.List;

@SpringBootApplication
public class ProblemSolvingApplication {
	static String name = "Ashhutoshs";


	public static void main(String[] args) {

		SpringApplication.run(ProblemSolvingApplication.class, args);

		ReverseThrWordsInString problem = new ReverseThrWordsInString();

		RemoveDuplicate.RemoveDuplicates(name);

		List<String> geg = new ArrayList<>();
		problem.reversewords();

		PalindromeString.newmethod();

	}

}
