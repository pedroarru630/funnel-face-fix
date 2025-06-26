

interface InstagramProfile {
  username: string;
  fullName?: string;
  profilePicUrlHD: string;
  exists: boolean;
}

interface ApifyResponse {
  urlsFromSearch?: string[];
  data?: {
    items?: Array<{
      username: string;
      fullName?: string;
      profilePicUrlHD?: string;
    }>;
  };
}

export class InstagramService {
  private static APIFY_API_URL = 'https://api.apify.com/v2/actor-tasks/chatty_coaster~instagram-scraper-task/run-sync?token=apify_api_Tk435sUb2WnBllXsxxfNQaBLkHSZyz0HLRCO';

  static async getProfile(username: string): Promise<InstagramProfile> {
    try {
      console.log('Fetching Instagram profile for:', username);
      
      const cleanUsername = username.replace('@', '');
      
      const response = await fetch(this.APIFY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addParentData: true,
          enhanceUserSearchWithFacebookPage: false,
          isUserReelFeedURL: false,
          isUserTaggedFeedURL: false,
          resultsLimit: 1,
          resultsType: "details",
          search: cleanUsername,
          searchLimit: 1,
          searchType: "user"
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }

      const responseJson = await response.json();
      console.log('=== RAW APIFY API RESPONSE ===');
      console.log('Full response:', JSON.stringify(responseJson, null, 2));
      console.log('Response type:', typeof responseJson);
      console.log('Is array?', Array.isArray(responseJson));
      
      if (Array.isArray(responseJson)) {
        console.log('Response length:', responseJson.length);
        if (responseJson.length > 0) {
          console.log('First item:', JSON.stringify(responseJson[0], null, 2));
          console.log('First item profilePicUrlHD:', responseJson[0].profilePicUrlHD);
          console.log('First item username:', responseJson[0].username);
          console.log('First item fullName:', responseJson[0].fullName);
        }
      }

      // The key fix: Apify returns an array, we need the first element
      if (Array.isArray(responseJson) && responseJson.length > 0) {
        const profileData = responseJson[0];
        console.log('Profile data extracted from array:', profileData);
        
        return {
          username: profileData.username || cleanUsername,
          fullName: profileData.fullName,
          profilePicUrlHD: profileData.profilePicUrlHD || `https://www.instagram.com/${cleanUsername}/`,
          exists: true
        };
      }

      // Fallback for legacy format (object with urlsFromSearch and data.items)
      const apifyResponse = responseJson as ApifyResponse;
      
      // Check if we have URLs from search (indicates profile exists)
      if (apifyResponse.urlsFromSearch && apifyResponse.urlsFromSearch.length > 0) {
        const instagramUrl = apifyResponse.urlsFromSearch[0];
        console.log('Profile URL found:', instagramUrl);
        
        // Extract username from URL if possible
        const urlUsername = instagramUrl.match(/instagram\.com\/([^\/]+)/)?.[1] || cleanUsername;
        
        // Check if we also have detailed profile data with profile picture
        const items = apifyResponse.data?.items || [];
        let profilePicUrlHD = `https://scontent-cdg4-1.cdninstagram.com/v/t51.2885-19/44884218_345707102882519_2446069589734326272_n.jpg?_nc_ht=scontent-cdg4-1.cdninstagram.com&_nc_cat=1&_nc_ohc=Yx4hrjVrjIsQ7kNvgGrTEdY&_nc_gid=bef4e65e5c2c4055bfb7e55c90e77d7e&edm=APs17CUBAAAA&ccb=7-5&oh=00_AYAawJlcHJQFKcDGz9xW4DH0bQkr2WOc8J6nqUOe2R_9XA&oe=67771FDA&_nc_sid=10d13b`;
        let fullName = urlUsername;
        
        if (items.length > 0) {
          const profileData = items[0];
          console.log('Profile data found:', profileData);
          
          // Extract profile picture URL
          if (profileData.profilePicUrlHD) {
            profilePicUrlHD = profileData.profilePicUrlHD;
            console.log('Profile picture URL extracted:', profilePicUrlHD);
          }
          
          if (profileData.fullName) {
            fullName = profileData.fullName;
          }
        }
        
        const finalProfile = {
          username: urlUsername,
          fullName: fullName,
          profilePicUrlHD: profilePicUrlHD,
          exists: true
        };
        
        console.log('Final profile object being returned:', finalProfile);
        return finalProfile;
      }

      // Fallback for legacy format
      const items = apifyResponse.data?.items || [];
      if (items.length > 0) {
        const profileData = items[0];
        console.log('Profile data found in legacy format:', profileData);
        
        return {
          username: profileData.username || cleanUsername,
          fullName: profileData.fullName,
          profilePicUrlHD: profileData.profilePicUrlHD || `https://scontent-cdg4-1.cdninstagram.com/v/t51.2885-19/44884218_345707102882519_2446069589734326272_n.jpg?_nc_ht=scontent-cdg4-1.cdninstagram.com&_nc_cat=1&_nc_ohc=Yx4hrjVrjIsQ7kNvgGrTEdY&_nc_gid=bef4e65e5c2c4055bfb7e55c90e77d7e&edm=APs17CUBAAAA&ccb=7-5&oh=00_AYAawJlcHJQFKcDGz9xW4DH0bQkr2WOc8J6nqUOe2R_9XA&oe=67771FDA&_nc_sid=10d13b`,
          exists: true
        };
      }

      console.log('No profile data returned from API');
      return {
        username: cleanUsername,
        fullName: undefined,
        profilePicUrlHD: `https://scontent-cdg4-1.cdninstagram.com/v/t51.2885-19/44884218_345707102882519_2446069589734326272_n.jpg?_nc_ht=scontent-cdg4-1.cdninstagram.com&_nc_cat=1&_nc_ohc=Yx4hrjVrjIsQ7kNvgGrTEdY&_nc_gid=bef4e65e5c2c4055bfb7e55c90e77d7e&edm=APs17CUBAAAA&ccb=7-5&oh=00_AYAawJlcHJQFKcDGz9xW4DH0bQkr2WOc8J6nqUOe2R_9XA&oe=67771FDA&_nc_sid=10d13b`,
        exists: false
      };
      
    } catch (error) {
      console.error('Error fetching Instagram profile:', error);
      return {
        username: username.replace('@', ''),
        fullName: undefined,
        profilePicUrlHD: `https://scontent-cdg4-1.cdninstagram.com/v/t51.2885-19/44884218_345707102882519_2446069589734326272_n.jpg?_nc_ht=scontent-cdg4-1.cdninstagram.com&_nc_cat=1&_nc_ohc=Yx4hrjVrjIsQ7kNvgGrTEdY&_nc_gid=bef4e65e5c2c4055bfb7e55c90e77d7e&edm=APs17CUBAAAA&ccb=7-5&oh=00_AYAawJlcHJQFKcDGz9xW4DH0bQkr2WOc8J6nqUOe2R_9XA&oe=67771FDA&_nc_sid=10d13b`,
        exists: false
      };
    }
  }
}

