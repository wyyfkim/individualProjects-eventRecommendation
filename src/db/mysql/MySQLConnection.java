package db.mysql;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import db.DBConnection;
import entity.Item;
import entity.Item.ItemBuilder;
import external.TicketMasetAPI;

public class MySQLConnection implements DBConnection {
	
	private Connection conn;
	
	private PreparedStatement saveItemStmt = null;
	
	//Singleton:按需create preparestatemt
//	private PreparedStatement getSaveItemStmt() {
//		try {		
//			if (saveItemStmt == null) {
//				if (conn == null) {
//					System.err.println("error");
//					return null;
//				} 
//				saveItemStmt = conn.prepareStatement("INSERT IGNORE INTO items VALUES(?,?)");
//			} 
//		} catch (Exception e) {
//			e.printStackTrace();
//		}
//		return saveItemStmt;
//	}
	public MySQLConnection() {
		try {
			Class.forName("com.mysql.cj.jdbc.Driver").getConstructor().newInstance();//前边的就够了，但有些java有bug，不叫constructor，我们要强制叫
			conn = DriverManager.getConnection(MySQLDBUtil.URL);
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	@Override
	public void close() {
		// TODO Auto-generated method stub
		if (conn != null) {
			try {
				conn.close();
			} catch(Exception e) {
				e.printStackTrace();
			}
		}
	}

	@Override
	public void setFavoriteItems(String userId, List<String> itemIds) {
		//／给定一组Item，我们要设定一下
		//把这些数据填到history表里
		if (conn == null) {
			System.err.println("DB Connection failed");
			return;
		}
		try {
			String sql = "INSERT IGNORE INTO history (user_id, item_id) VALUES (?,?)";
			PreparedStatement stmt = conn.prepareStatement(sql);
			stmt.setString(1, userId);
			for (String itemId : itemIds) {
				stmt.setString(2, itemId);
				stmt.execute();
			}
		} catch (SQLException e) {
			e.printStackTrace();
		}
	}

	@Override
	public void unsetFavoriteItems(String userId, List<String> itemIds) {
		//跟setFav看上去有很多很像，只有sql语句不同，是否可以合并优化？最好不要合并优化，因为sql语句其实差别非常大
		if (conn == null) {
			System.err.println("DB Connection failed");
			return;
		}
		try {
			String sql = "DELETE FROM history WHERE user_id = ? AND item_id = ?";
			PreparedStatement stmt = conn.prepareStatement(sql);
			stmt.setString(1, userId);
			for (String itemId : itemIds) {
				stmt.setString(2, itemId);
				stmt.execute();
			}
		} catch (SQLException e) {
			e.printStackTrace();
		}
	}

	@Override
	public Set<String> getFavoriteItemIds(String userId) {
		if (conn == null) {
			System.err.println("DB Connection failed!");
			return new HashSet<>();
		}
		Set<String> itemIds = new HashSet<>();
		try {
			String sql = "SELECT item_id FROM history WHERE user_id = ?";
			PreparedStatement stmt = conn.prepareStatement(sql);
			stmt.setString(1, userId);
			ResultSet rs = stmt.executeQuery();
			while (rs.next()) {
				String itemId = rs.getString("item_id");
				itemIds.add(itemId);
			}
		} catch (SQLException e) {
			e.printStackTrace();
		}
		return itemIds;
	}

	@Override
	public Set<Item> getFavoriteItems(String userId) {
		if (conn == null) {
			System.err.println("DB Connection failed!");
			return new HashSet<>();
		}
		Set<Item> favoriteItems = new HashSet<>();
		Set<String> itemIds = getFavoriteItemIds(userId);
		try {
			//从数据库中查找复合条件的语句：Select
			String sql = "SELECT * FROM items WHERE item_id = ?";
			//看到有“？”就要用preparedStatement。原因1防止injection，2可以复用（只更换param就可以）
			PreparedStatement stmt = conn.prepareStatement(sql);
			for (String itemId : itemIds) {
				stmt.setString(1, itemId);
				
				ResultSet rs = stmt.executeQuery();
				
				ItemBuilder builder = new ItemBuilder();
				while (rs.next()) {
					//每次用某个id查询的时候只可能返回一个值（因其是primary key），所以这里用if查询也可以
					builder.setItemId(rs.getString("item_id"));
					builder.setName(rs.getString("name"));
					builder.setAddress(rs.getString("address"));
					builder.setImageUrl(rs.getString("image_url"));
					builder.setUrl(rs.getString("url"));
					builder.setCategories((getCategories(itemId)));
					builder.setRating(rs.getDouble("rating"));
					builder.setDistance(rs.getDouble("distance"));
					
					favoriteItems.add(builder.build());
				}
			}
		} catch (SQLException e) {
			e.printStackTrace();
		}
		return favoriteItems;
	}

	@Override
	public Set<String> getCategories(String itemId) {
		if (conn == null) {
			System.err.println("DB Connection failed!");
			return new HashSet<>();
		}
		Set<String> categories = new HashSet<>();
		try {
			String sql = "SELECT category FROM categories WHERE item_id = ?";
			PreparedStatement stmt = conn.prepareStatement(sql);
			stmt.setString(1, itemId);
			ResultSet rs = stmt.executeQuery();
			while (rs.next()) {
				categories.add(rs.getString("category"));
			}
		} catch (SQLException e) {
			e.printStackTrace();
		}
		return categories;
	}

	@Override
	public List<Item> searchItems(double lat, double lon, String term) {
		TicketMasetAPI tmAPI = new TicketMasetAPI();
		List<Item> items = tmAPI.search(lat, lon, term);
		for (Item item : items) {
			//先保存一下再返回给前端
			saveItem(item);
		}
		return items;
	}

	@Override
	public void saveItem(Item item) {
		if (conn == null) {
			//进行数据库操作的时候在前面进行一下判断
			System.err.println("DB connection failed!");
			return;
		}
		try {
			//SQl Injection: example:
			//SELECT * FROM users WHERE username = '<username>' AND password = '<password>'
			//username: aoweifapweroj' OR 1=1 --
			//password:joasdharsg
			//->
			//SELECT * FROM users WHERE username = 'aoweifapweroj' OR 1=1 --' AND password = 'joasdharsg'
			//结果就是返回了所有的users
//			String sql = String.format("INSERT INTO items (‘%s’, ‘%s’, ‘%s’, ‘%s’, ‘%s’, ‘%s’, ‘%s’)", 
//					item.getItemId(), ....);
			//问题：每次查询相同para的话返回时一样的结果，如果这么些的话primary key相同的值插入会报错
			
//			String sql = "INSERT IGNORE INTO items VALUES (?, ?, ?, ?, ?, ?, ?)";
			//IGNORE就是如果主键相同的话直接忽略
//			PreparedStatement stmt = conn.prepareStatement(sql);
//
//			stmt.setString(1, item.getItemId());
//			stmt.setString(2, item.getName());
//			stmt.setDouble(3, item.getRating());
//			stmt.setString(4, item.getAddress());
//			stmt.setString(5, item.getImageUrl());
//			stmt.setString(6, item.getUrl());
//			stmt.setDouble(7, item.getDistance());
//			stmt.execute();
			
			String sql = "INSERT IGNORE INTO items VALUES (?, ?, ?, ?, ?, ?, ?)";
			PreparedStatement stmt = conn.prepareStatement(sql);
			stmt.setString(1, item.getItemId());
			stmt.setString(2, item.getName());
			stmt.setDouble(3, item.getRating());
			stmt.setString(4, item.getAddress());
			stmt.setString(5, item.getImageUrl());
			stmt.setString(6, item.getUrl());
			stmt.setDouble(7, item.getDistance());
			stmt.execute();

			
			sql = "INSERT IGNORE INTO categories VALUES(?, ?)";
			for (String category : item.getCategories()) {
				stmt = conn.prepareStatement(sql);
				stmt.setString(1, item.getItemId());
				stmt.setString(2, category);
				stmt.execute();
			}
		} catch (SQLException e) {
			e.printStackTrace();
		}
	}

	@Override
	public String getFullname(String userId) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public boolean verifyLogin(String userId, String password) {
		// TODO Auto-generated method stub
		return false;
	}

}
