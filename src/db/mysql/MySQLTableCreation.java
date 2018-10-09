package db.mysql;

import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Connection;

public class MySQLTableCreation {
	// Run this as Java application to reset db schema.
	public static void main(String[] args) {
		//与其它不互通，就是创建table
		try {
			// Step 1 Connect to MySQL.
			System.out.println("Connection to " + MySQLDBUtil.URL);
			Class.forName("com.mysql.cj.jdbc.Driver").getConstructor().newInstance();
			//reflection: 通过运行期的值来作为输入，而不是编译期的值
			
			Connection conn = DriverManager.getConnection(MySQLDBUtil.URL);
			//做的工作就是注册自己到DriverManager里面去
			
			if(conn == null) {
				return;
			}
			//Step2:清理已经存在的表“DROP TABLE IF EXISTS table_name;”
			Statement stmt = conn.createStatement();
			String sql = "DROP TABLE IF EXISTS categories";
			stmt.executeUpdate(sql);
			//为什么不直接用execute，而是要executeUpdate？区别是看返回值。
//			execute返回是否成功
//			executeUpdate返回这一个操作影响了几行／几个数据库
//			executeQuery返回result set
			
			
			sql = "DROP TABLE IF EXISTS history";
			stmt.executeUpdate(sql);
			
			sql = "DROP TABLE IF EXISTS items";
			stmt.executeUpdate(sql);
			
			sql = "DROP TABLE IF EXISTS users";
			stmt.executeUpdate(sql);
						
			//Step3: create new tables
			sql = "CREATE TABLE items ("
					+ "item_id VARCHAR(255) NOT NULL,"
					+ "name VARCHAR(255),"
					+ "rating FLOAT,"
					+ "address VARCHAR(255),"
					+ "image_url VARCHAR(255),"
					+ "url VARCHAR(255),"
					+ "distance FLOAT,"
					+ "PRIMARY KEY (item_id)"
					+ ")";
			stmt.executeUpdate(sql);
			
			//复合型数据创建单独的表。多对多的关系
			sql = "CREATE TABLE categories ("
					+ "item_id VARCHAR(255) NOT NULL,"
					+ "category VARCHAR(255) NOT NULL,"
					+ "PRIMARY KEY (item_id, category),"
					+ "FOREIGN KEY (item_id) REFERENCES items(item_id)"
					+ ")";
			stmt.executeUpdate(sql);

			sql = "CREATE TABLE users ("
					+ "user_id VARCHAR(255) NOT NULL,"
					+ "password VARCHAR(255) NOT NULL,"
					+ "first_name VARCHAR(255),"
					+ "last_name VARCHAR(255),"
					+ "PRIMARY KEY (user_id)"
					+ ")";
			stmt.executeUpdate(sql);

			sql = "CREATE TABLE history ("
					+ "user_id  VARCHAR(255) NOT NULL,"
					+ "item_id  VARCHAR(255) NOT NULL,"
					+ "last_favor_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,"
					+ "PRIMARY KEY (user_id, item_id),"
					+ "FOREIGN KEY (item_id) REFERENCES items(item_id),"
					+ "FOREIGN KEY (user_id) REFERENCES users(user_id)"
					+ ")";
			stmt.executeUpdate(sql);
			
			//Step4: Insert a testing sample
			sql = "INSERT INTO users VALUES ("
					+ "'1111','wyyf266200KIM','John','Smith')";
			System.out.println("Executing query: " + sql);
			stmt.executeUpdate(sql);

	
			
			
			System.out.print("Import done successfully");
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
}